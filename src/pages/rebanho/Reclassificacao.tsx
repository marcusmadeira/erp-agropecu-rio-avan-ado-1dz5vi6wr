import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function Reclassificacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [form, setForm] = useState({
    category: 'Vaca Descarte TIP',
    loteId: '',
    costCenter: 'CC02-TIP',
    motivo: '',
  })

  const poAnimals = state.animais.filter((a) => a.costCenter === 'CC01-PO' && a.status === 'Ativo')

  const openForm = (animal: any) => {
    setSelectedAnimal(animal)
    setForm({ category: 'Vaca Descarte TIP', loteId: '', costCenter: 'CC02-TIP', motivo: '' })
    setOpen(true)
  }

  const handleReclassificar = () => {
    if (!selectedAnimal || !form.loteId || !form.motivo) {
      toast({
        title: 'Aviso',
        description: 'Preencha o Lote e o Motivo Obrigatório.',
        variant: 'destructive',
      })
      return
    }

    dispatch((s) => ({
      ...s,
      animais: s.animais.map((a) =>
        a.id === selectedAnimal.id
          ? {
              ...a,
              costCenter: form.costCenter as any,
              status: `Reclassificado`,
              categoria: form.category,
              loteId: form.loteId,
            }
          : a,
      ),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Animais',
          recordId: selectedAnimal.brinco,
          oldValue: 'CC01-PO',
          newValue: `Mudança para ${form.costCenter} / Motivo: ${form.motivo}`,
        },
        ...s.auditLogs,
      ],
    }))

    setOpen(false)
    toast({
      title: 'Reclassificação Sucesso!',
      description: 'Animal enviado para engorda comercial.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-bold text-emerald-900">Reclassificação (Descarte PO)</h2>
      </div>
      <p className="text-muted-foreground">
        Obrigue a transferência de centro de custo com motivo justificado p/ animais PO
        desclassificados.
      </p>

      <Card className="shadow-subtle border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Animais PO Elegíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead>
                <TableHead>Categoria Atual</TableHead>
                <TableHead>C. Custo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poAnimals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold">{a.brinco}</TableCell>
                  <TableCell>{a.categoria}</TableCell>
                  <TableCell>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">
                      {a.costCenter}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300"
                      onClick={() => openForm(a)}
                    >
                      Rebaixar p/ TIP <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação Comercial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Motivo Obrigatório</Label>
              <Input
                required
                placeholder="Ex: Falha reprodutiva, Defeito fenotípico"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </div>
            <div>
              <Label>Nova Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vaca Descarte TIP">Vaca Descarte TIP</SelectItem>
                  <SelectItem value="Novilha TIP">Novilha TIP</SelectItem>
                  <SelectItem value="Garrote TIP">Garrote TIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote Destino (Engorda)</Label>
              <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Lote..." />
                </SelectTrigger>
                <SelectContent>
                  {state.lotes
                    .filter((l) => l.costCenter === 'CC02-TIP')
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleReclassificar}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Confirmar Rebaixamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
