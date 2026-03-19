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

const safeDate = () => new Date().toISOString().split('T')[0]

export default function EventosRepro() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    animalId: '',
    type: 'IATF',
    touro: '',
    semenId: 'none',
    dataD0: safeDate(),
    dataIATF: safeDate(),
  })

  const semenStock = state.estoque.filter((e) => e.category === 'Sêmen' && e.quantity > 0)
  const matrizes = state.animais.filter(
    (a) => a.categoria.includes('Matriz') && a.status === 'Ativo',
  )

  const handleSave = () => {
    if (!form.animalId) return
    const date =
      form.type === 'IATF' ? new Date(form.dataIATF).toISOString() : new Date().toISOString()
    const prevToque =
      form.type === 'IATF'
        ? addDays(new Date(form.dataIATF), 30).toISOString()
        : addDays(new Date(), 30).toISOString()
    const dpp =
      form.type === 'IATF'
        ? addDays(new Date(form.dataIATF), 295).toISOString()
        : addDays(new Date(), 295).toISOString()

    let touroName = form.touro
    let semenItem = null

    if (form.type === 'IATF' && form.semenId !== 'none') {
      semenItem = state.estoque.find((e) => e.id === form.semenId)
      if (semenItem) touroName = semenItem.name
    }

    dispatch((s) => {
      let updatedEstoque = s.estoque
      let auditLogs = [...s.auditLogs]

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
            dataD0: form.type === 'IATF' ? new Date(form.dataD0).toISOString() : undefined,
            dataIATF: form.type === 'IATF' ? new Date(form.dataIATF).toISOString() : undefined,
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
        ? `1 dose de ${semenItem.name} deduzida do estoque.`
        : 'Previsões calculadas automaticamente.',
    })
    setForm({
      animalId: '',
      type: 'IATF',
      touro: '',
      semenId: 'none',
      dataD0: safeDate(),
      dataIATF: safeDate(),
    })
  }

  const registrarDG = (reproId: string, result: 'Prenhe' | 'Vazia') => {
    dispatch((s) => {
      const repro = s.reproducoes.find((r) => r.id === reproId)
      if (!repro) return s
      const baseDate = repro.dataIATF ? parseISO(repro.dataIATF) : parseISO(repro.date)
      const dpp = result === 'Prenhe' ? addDays(baseDate, 295).toISOString() : repro.dpp

      return {
        ...s,
        reproducoes: s.reproducoes.map((r) =>
          r.id === reproId ? { ...r, status: result, dpp } : r,
        ),
        auditLogs: [
          {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            userName: s.currentUser?.name || 'Sistema',
            action: 'Update',
            table: 'Reproducoes',
            recordId: reproId,
            oldValue: 'Aguardando Toque',
            newValue: result,
          },
          ...s.auditLogs,
        ],
      }
    })
    toast({
      title: 'Diagnóstico de Gestação',
      description: result === 'Prenhe' ? 'DPP atualizado para IATF+295 dias.' : 'Vazia registrada.',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-emerald-900">Manejo Reprodutivo PO</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-800">Novo Protocolo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar IATF ou Monta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Matriz</Label>
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
                        {m.brinco}
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
                    <SelectItem value="IATF">Protocolo IATF</SelectItem>
                    <SelectItem value="Monta">Monta Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === 'IATF' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Data D0</Label>
                      <Input
                        type="date"
                        value={form.dataD0}
                        onChange={(e) => setForm({ ...form, dataD0: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Data IATF</Label>
                      <Input
                        type="date"
                        value={form.dataIATF}
                        onChange={(e) => setForm({ ...form, dataIATF: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Sêmen Planejado (Baixa Estoque)</Label>
                    <Select
                      value={form.semenId}
                      onValueChange={(v) => setForm({ ...form, semenId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o Botijão..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Manual</SelectItem>
                        {semenStock.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.quantity} doses disp.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {(form.type === 'Monta' || form.semenId === 'none') && (
                <div className="space-y-1">
                  <Label>Touro (Manual)</Label>
                  <Input
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
                <TableHead>Matriz</TableHead>
                <TableHead>Protocolo / Sêmen</TableHead>
                <TableHead>Cronograma (D0 / IATF)</TableHead>
                <TableHead>Prev. DG Toque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Registrar DG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.reproducoes.map((r) => {
                const a = state.animais.find((x) => x.id === r.animalId)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{a?.brinco}</TableCell>
                    <TableCell>
                      {r.type}{' '}
                      <span className="text-xs text-muted-foreground block">{r.touro}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.type === 'IATF' ? (
                        <>
                          <div>D0: {r.dataD0 ? format(parseISO(r.dataD0), 'dd/MM/yyyy') : '-'}</div>
                          <div>
                            IA:{' '}
                            {r.dataIATF
                              ? format(parseISO(r.dataIATF), 'dd/MM/yyyy')
                              : format(parseISO(r.date), 'dd/MM/yyyy')}
                          </div>
                        </>
                      ) : (
                        format(parseISO(r.date), 'dd/MM/yyyy')
                      )}
                    </TableCell>
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
                    <TableCell className="text-right">
                      {r.status === 'Aguardando Toque' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 bg-emerald-50"
                            onClick={() => registrarDG(r.id, 'Prenhe')}
                          >
                            Prenhe
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-700 bg-rose-50"
                            onClick={() => registrarDG(r.id, 'Vazia')}
                          >
                            Vazia
                          </Button>
                        </div>
                      )}
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
