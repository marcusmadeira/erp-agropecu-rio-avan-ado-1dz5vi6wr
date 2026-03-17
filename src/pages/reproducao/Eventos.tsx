import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { format, addDays, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function EventosRepro() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ animalId: '', type: 'IATF' })

  const handleSave = () => {
    if (!form.animalId) return
    const date = new Date().toISOString()
    const prevToque = addDays(new Date(), 30).toISOString()
    const dpp = addDays(new Date(), 295).toISOString()

    dispatch((s) => ({
      ...s,
      reproducoes: [
        ...s.reproducoes,
        {
          id: Math.random().toString(),
          animalId: form.animalId,
          type: form.type as any,
          date,
          previsaoToque: prevToque,
          dpp,
          status: 'Aguardando Toque',
        },
      ],
    }))
    setOpen(false)
    toast({
      title: 'Evento Reprodutivo Registrado',
      description: 'Previsões calculadas automaticamente.',
    })
  }

  const matrizes = state.animais.filter((a) => a.categoria === 'Matriz' && a.status === 'Ativo')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IATF">Inseminação (IATF)</SelectItem>
                  <SelectItem value="Monta">Monta Natural</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="w-full bg-emerald-800">
                Salvar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco da Matriz</TableHead>
                <TableHead>Tipo</TableHead>
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
                    <TableCell>{r.type}</TableCell>
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
