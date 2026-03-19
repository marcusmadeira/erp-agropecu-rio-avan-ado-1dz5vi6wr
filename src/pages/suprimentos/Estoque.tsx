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
import { Box, BrainCircuit, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function Estoque() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="text-emerald-900 w-8 h-8" />
          <h2 className="text-2xl font-bold text-emerald-900">Estoque de Insumos</h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {state.userRole !== 3 && (
            <Button
              variant="outline"
              asChild
              className="flex-1 sm:flex-none text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold shadow-sm"
            >
              <Link to="/previsao-demanda">
                <BrainCircuit className="w-4 h-4 mr-2" /> Previsão IA
              </Link>
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none bg-emerald-800 shadow-sm">
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
