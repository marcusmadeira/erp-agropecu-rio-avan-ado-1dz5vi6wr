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
import { Box, BrainCircuit, Plus, FileText, Upload, RefreshCw } from 'lucide-react'
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

    // Mock AI OCR process
    setTimeout(() => {
      setExtractedItems([
        {
          id: Math.random().toString(),
          name: 'Vacina Clostridiose 50 Doses',
          category: 'Saúde',
          quantity: 200,
          unit: 'Doses',
          unitCost: 1.5,
        },
        {
          id: Math.random().toString(),
          name: 'Sêmen Touro REM Armador',
          category: 'Sêmen',
          quantity: 50,
          unit: 'Doses',
          unitCost: 45.0,
        },
        {
          id: Math.random().toString(),
          name: 'Sal Mineral Protéico',
          category: 'Nutrição',
          quantity: 2000,
          unit: 'Kg',
          unitCost: 3.2,
        },
      ])
      setIsAnalyzing(false)
      toast({ title: 'Leitura Concluída', description: 'Dados extraídos da Nota Fiscal com IA.' })
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
    toast({
      title: 'Estoque Atualizado',
      description: 'Todos os itens da NF-e foram importados com sucesso.',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="text-emerald-900 w-8 h-8" />
          <h2 className="text-2xl font-bold text-emerald-900">Estoque de Insumos</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {state.userRole !== 3 && (
            <Button
              variant="outline"
              asChild
              className="text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold shadow-sm"
            >
              <Link to="/previsao-demanda">
                <BrainCircuit className="w-4 h-4 mr-2" /> Previsão IA
              </Link>
            </Button>
          )}

          {/* Botão OCR IA */}
          <Dialog
            open={ocrOpen}
            onOpenChange={(v) => {
              setOcrOpen(v)
              if (!v) setExtractedItems([])
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-amber-700 border-amber-200 hover:bg-amber-50 shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" /> Ler NF-e (IA)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                  Importação de NF-e Inteligente (OCR)
                </DialogTitle>
                <DialogDescription>
                  Faça o upload do PDF da Nota Fiscal. A Inteligência Artificial irá identificar os
                  produtos e categorizá-los.
                </DialogDescription>
              </DialogHeader>

              {extractedItems.length === 0 ? (
                <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 relative hover:bg-slate-100 transition-colors">
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
                      <p className="font-semibold text-slate-700">Processando com IA...</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Extraindo produtos, quantidades e valores.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-slate-400 mb-3" />
                      <p className="font-semibold text-slate-700">Arraste a NF-e aqui (PDF/JPG)</p>
                      <p className="text-xs text-muted-foreground mt-1">Ou clique para procurar</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="max-h-[300px] overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto Encontrado</TableHead>
                          <TableHead>Categoria (IA)</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-xs">{item.name}</TableCell>
                            <TableCell className="text-xs">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                                {item.category}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              R$ {item.unitCost.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button className="w-full bg-emerald-800" onClick={handleSaveOcr}>
                    Confirmar e Inserir no Estoque
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Botão Nova Entrada Manual */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-800 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Novo Insumo no Estoque</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 mt-2">
                <div>
                  <Label>Nome do Produto</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                        <SelectItem value="Saúde">Saúde (Vacinas)</SelectItem>
                        <SelectItem value="Sêmen">Sêmen (Genética)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade Inicial</Label>
                    <Input
                      required
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Custo Unitário (R$)</Label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      value={form.unitCost}
                      onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-emerald-800 mt-2">
                  Adicionar Estoque
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
                <TableHead>Produto / Insumo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Quantidade Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.estoque.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold">{e.name}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    R$ {e.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-800 font-bold">
                    {e.quantity} {e.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
