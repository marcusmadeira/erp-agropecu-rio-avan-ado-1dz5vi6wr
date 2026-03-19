import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format, addDays, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function EventosRepro() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ animalId: '', type: 'IATF', touro: '', semenId: 'none' })

  const semenStock = state.estoque.filter((e) => e.category === 'Sêmen' && e.quantity > 0)

  const handleSave = () => {
    if (!form.animalId) return
    const date = new Date().toISOString()
    const prevToque = addDays(new Date(), 30).toISOString()
    const dpp = addDays(new Date(), 295).toISOString()

    let touroName = form.touro
    let semenItem = null

    if (form.type === 'IATF' && form.semenId !== 'none') {
      semenItem = state.estoque.find((e) => e.id === form.semenId)
      if (semenItem) {
        touroName = semenItem.name
      }
    }

    dispatch((s) => {
      let updatedEstoque = s.estoque
      let auditLogs = [...s.auditLogs]

      // Deduct semen if selected
      if (semenItem) {
        updatedEstoque = s.estoque.map((e) =>
          e.id === form.semenId ? { ...e, quantity: e.quantity - 1 } : e,
        )
        auditLogs = [
          {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            userName: s.currentUser?.name || 'Sistema',
            action: 'Update',
            table: 'Estoque',
            recordId: semenItem.name,
            oldValue: `${semenItem.quantity} Doses`,
            newValue: `${semenItem.quantity - 1} Doses (IATF)`,
          },
          ...auditLogs,
        ]
      }

      return {
        ...s,
        estoque: updatedEstoque,
        auditLogs,
        reproducoes: [
          ...s.reproducoes,
          {
            id: Math.random().toString(),
            animalId: form.animalId,
            type: form.type as any,
            touro: touroName,
            date,
            previsaoToque: prevToque,
            dpp,
            status: 'Aguardando Toque',
          },
        ],
      }
    })

    setOpen(false)
    toast({
      title: 'Evento Reprodutivo Registrado',
      description: semenItem
        ? `Previsões calculadas. 1 dose de ${semenItem.name} debitada do estoque.`
        : 'Previsões de Toque e DPP calculadas automaticamente.',
    })
    setForm({ animalId: '', type: 'IATF', touro: '', semenId: 'none' })
  }

  const matrizes = state.animais.filter((a) => a.categoria === 'Matriz' && a.status === 'Ativo')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-emerald-900">Eventos Reprodutivos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-800">Registrar Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Evento (IATF / Monta)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>Matriz (Fêmea)</Label>
                <Select
                  value={form.animalId}
                  onValueChange={(v) => setForm({ ...form, animalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Matriz" />
                  </SelectTrigger>
                  <SelectContent>
                    {matrizes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        Brinco: {m.brinco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Tipo de Evento</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IATF">Inseminação (IATF)</SelectItem>
                    <SelectItem value="Monta">Monta Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === 'IATF' ? (
                <div className="space-y-1">
                  <Label>Sêmen Utilizado (Baixa Automática no Estoque)</Label>
                  <Select
                    value={form.semenId}
                    onValueChange={(v) => setForm({ ...form, semenId: v, touro: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Outro / Lançamento Manual</SelectItem>
                      {semenStock.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.quantity} doses disp.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {(form.type === 'Monta' || form.semenId === 'none') && (
                <div className="space-y-1">
                  <Label>Touro / Sêmen (Descrição Manual)</Label>
                  <Input
                    placeholder="Identificação do Touro/Sêmen"
                    value={form.touro}
                    onChange={(e) => setForm({ ...form, touro: e.target.value })}
                  />
                </div>
              )}

              <Button onClick={handleSave} className="w-full bg-emerald-800">
                Salvar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco da Matriz</TableHead>
                <TableHead>Tipo / Touro (Sêmen)</TableHead>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Previsão Toque (+30d)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.reproducoes.map((r) => {
                const a = state.animais.find((x) => x.id === r.animalId)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{a?.brinco}</TableCell>
                    <TableCell>
                      {r.type} <span className="text-xs text-muted-foreground ml-1">{r.touro}</span>
                    </TableCell>
                    <TableCell>{format(parseISO(r.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-mono">
                      {format(parseISO(r.previsaoToque), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'Prenhe'
                            ? 'default'
                            : r.status === 'Parida'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {r.status}
                      </Badge>
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
