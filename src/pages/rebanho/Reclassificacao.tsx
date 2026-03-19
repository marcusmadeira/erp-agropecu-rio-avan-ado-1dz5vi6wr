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
import { useToast } from '@/hooks/use-toast'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function Reclassificacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [form, setForm] = useState({ category: 'Descarte', loteId: '', costCenter: 'CC02-TIP' })

  const poAnimals = state.animais.filter((a) => a.costCenter === 'CC01-PO' && a.status === 'Ativo')

  const openForm = (animal: any) => {
    setSelectedAnimal(animal)
    setForm({ category: 'Descarte', loteId: '', costCenter: 'CC02-TIP' })
    setOpen(true)
  }

  const handleReclassificar = () => {
    if (!selectedAnimal || !form.loteId) {
      toast({ title: 'Erro', description: 'Selecione o Lote de destino.', variant: 'destructive' })
      return
    }

    dispatch((s) => ({
      ...s,
      animais: s.animais.map((a) =>
        a.id === selectedAnimal.id
          ? {
              ...a,
              costCenter: form.costCenter as any,
              status: `Reclassificado (${form.costCenter.replace('CC02-', '')})`,
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
          newValue: `${form.costCenter} / ${form.category}`,
        },
        ...s.auditLogs,
      ],
    }))

    setOpen(false)
    toast({
      title: 'Animal Reclassificado!',
      description: 'As alterações de Categoria, Lote e Centro de Custo foram aplicadas.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-bold text-emerald-900">
          Reclassificação de Animais (Descarte PO)
        </h2>
      </div>
      <p className="text-muted-foreground">
        Animais PO com falhas reprodutivas ou fenótipo indesejado devem ser movidos para terminação
        comercial (TIP).
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
                <TableHead>Categoria</TableHead>
                <TableHead>Centro de Custo Atual</TableHead>
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
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => openForm(a)}
                    >
                      Reclassificar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {poAnimals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum animal PO ativo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Animal de Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
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
                  <SelectItem value="Descarte">Descarte</SelectItem>
                  <SelectItem value="Boi Gordo">Boi Gordo (Terminação)</SelectItem>
                  <SelectItem value="Vaca Gorda">Vaca Gorda (Terminação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Novo Lote de Destino</Label>
              <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Lote..." />
                </SelectTrigger>
                <SelectContent>
                  {state.lotes.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.costCenter})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Novo Centro de Custo</Label>
              <Select
                value={form.costCenter}
                onValueChange={(v) => setForm({ ...form, costCenter: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC02-TIP">CC02-TIP (Comercial/Engorda)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleReclassificar}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Aplicar Reclassificação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
