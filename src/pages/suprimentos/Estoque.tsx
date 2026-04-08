import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Box, BrainCircuit, Plus, FileText, Upload, RefreshCw, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function Estoque() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [ocrOpen, setOcrOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '',
    category: 'Nutrição',
    quantity: '',
    unit: 'Kg',
    unitCost: '',
    botijao: '',
    caneca: '',
    minStock: '100',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.quantity || !form.unitCost) return

    dispatch((s) => ({
      ...s,
      estoque: [
        {
          id: Math.random().toString(),
          name: form.name,
          category: form.category,
          unit: form.unit,
          quantity: Number(form.quantity),
          unitCost: Number(form.unitCost),
          botijao: form.category === 'Sêmen' ? form.botijao : undefined,
          caneca: form.category === 'Sêmen' ? form.caneca : undefined,
          minStock: Number(form.minStock),
        },
        ...s.estoque,
      ],
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Create',
          table: 'Estoque',
          recordId: form.name,
          oldValue: '-',
          newValue: `${form.quantity} ${form.unit}`,
        },
        ...s.auditLogs,
      ],
    }))
    setOpen(false)
    toast({ title: 'Insumo Cadastrado', description: 'O estoque foi atualizado com sucesso.' })
  }

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsAnalyzing(true)

    setTimeout(() => {
      setExtractedItems([
        {
          id: Math.random().toString(),
          name: 'Vacina Clostridiose 50 Doses',
          category: 'Saúde',
          quantity: 200,
          unit: 'Doses',
          unitCost: 1.5,
          minStock: 50,
        },
        {
          id: Math.random().toString(),
          name: 'Sêmen Touro REM Armador',
          category: 'Sêmen',
          quantity: 50,
          unit: 'Doses',
          unitCost: 45.0,
          botijao: 'BT-EXT',
          caneca: 'C-01',
          minStock: 20,
        },
      ])
      setIsAnalyzing(false)
      toast({ title: 'Leitura Concluída', description: 'Dados extraídos da NF-e com IA.' })
    }, 2500)
  }

  const handleSaveOcr = () => {
    if (extractedItems.length === 0) return

    dispatch((s) => {
      const logs = extractedItems.map((item) => ({
        id: Math.random().toString(),
        date: new Date().toISOString(),
        userName: s.currentUser?.name || 'Sistema IA',
        action: 'Create' as any,
        table: 'Estoque',
        recordId: item.name,
        oldValue: 'NF-e IA',
        newValue: `${item.quantity} ${item.unit}`,
      }))

      return {
        ...s,
        estoque: [...extractedItems, ...s.estoque],
        auditLogs: [...logs, ...s.auditLogs],
      }
    })

    setOcrOpen(false)
    setExtractedItems([])
    toast({ title: 'Estoque Atualizado', description: 'Itens importados com sucesso.' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="text-primary w-8 h-8" />
          <h2 className="text-2xl font-bold text-primary">Insumos, Rações</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {state.userRole !== 3 && (
            <Button variant="outline" asChild className="text-indigo-700 border-indigo-200">
              <Link to="/previsao-demanda">
                <BrainCircuit className="w-4 h-4 mr-2" /> Previsão IA
              </Link>
            </Button>
          )}
          <Dialog
            open={ocrOpen}
            onOpenChange={(v) => {
              setOcrOpen(v)
              if (!v) setExtractedItems([])
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="text-amber-700 border-amber-200">
                <FileText className="w-4 h-4 mr-2" /> Ler NF-e (IA)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" /> OCR Inteligente
                </DialogTitle>
                <DialogDescription>
                  Extração automática de produtos e quantidades via PDF.
                </DialogDescription>
              </DialogHeader>

              {extractedItems.length === 0 ? (
                <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleOcrUpload}
                    disabled={isAnalyzing}
                  />
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center">
                      <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                      <p className="font-bold text-slate-700">Processando...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-slate-400 mb-3" />
                      <p className="font-bold text-slate-700">Arraste a NF-e aqui</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Cat.</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedItems.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-bold">{i.name}</TableCell>
                          <TableCell>{i.category}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {i.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button className="w-full bg-primary" onClick={handleSaveOcr}>
                    Confirmar Importação
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Novo Insumo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 mt-2">
                <Input
                  placeholder="Nome do Produto"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nutrição">Nutrição</SelectItem>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                        <SelectItem value="Sêmen">Sêmen Genética</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Unidade</Label>
                    <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="Doses">Doses</SelectItem>
                        <SelectItem value="Litros">Litros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.category === 'Sêmen' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Botijão</Label>
                      <Input
                        value={form.botijao}
                        onChange={(e) => setForm({ ...form, botijao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Caneca</Label>
                      <Input
                        value={form.caneca}
                        onChange={(e) => setForm({ ...form, caneca: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Custo Unit. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={form.unitCost}
                      onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Estoque Mínimo (Alerta)</Label>
                  <Input
                    type="number"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary mt-2">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Qtd Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.estoque.map((e) => {
                const isCritical = e.quantity < (e.minStock || 100)
                return (
                  <TableRow
                    key={e.id}
                    className={isCritical ? 'bg-rose-50/50 hover:bg-rose-50' : ''}
                  >
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        {isCritical && (
                          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                        )}
                        <span className={isCritical ? 'text-rose-700' : ''}>{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {e.category}
                      {e.category === 'Sêmen' && e.botijao && (
                        <span className="block text-[10px] text-muted-foreground">
                          Botijão: {e.botijao} / Caneca: {e.caneca}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono font-medium">
                      R$ {e.unitCost.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-primary'}`}
                    >
                      {e.quantity} {e.unit}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
