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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'

export default function Nascimentos() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedRepro, setSelectedRepro] = useState<any>(null)
  const [form, setForm] = useState({ peso: '', sexo: 'M' })

  const prenhes = state.reproducoes.filter((r) => r.status === 'Prenhe')

  const handleRegistrar = () => {
    if (!selectedRepro) return
    const matriz = state.animais.find((a) => a.id === selectedRepro.animalId)
    if (!matriz) return

    dispatch((s) => {
      const repros = s.reproducoes.map((r) =>
        r.id === selectedRepro.id ? { ...r, status: 'Parida' as any } : r,
      )
      const novoBezerro = {
        id: Math.random().toString(),
        brinco: 'PENDENTE',
        loteId: matriz.loteId,
        categoria: 'Bezerro',
        pesoAtual: Number(form.peso),
        gmd: 0,
        mae: matriz.id,
        status: 'Ativo',
        birthDate: new Date().toISOString(),
        costCenter: matriz.costCenter,
        gender: form.sexo as any,
      }

      const offlineAction = {
        id: Math.random().toString(),
        type: 'CREATE_NASCIMENTO',
        payload: { maeId: matriz.id, peso: Number(form.peso), sexo: form.sexo },
        timestamp: new Date().toISOString(),
      }

      return {
        ...s,
        reproducoes: repros,
        animais: [...s.animais, novoBezerro],
        pendingSyncQueue: s.isOnline ? s.pendingSyncQueue : [...s.pendingSyncQueue, offlineAction],
      }
    })
    setOpen(false)
    toast({
      title: state.isOnline ? 'Nascimento Registrado' : 'Salvo no Dispositivo',
      description: 'Ficha do bezerro criada na maternidade.',
    })
    setForm({ peso: '', sexo: 'M' })
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <h2 className="text-2xl font-bold text-emerald-900">Nascimentos e Maternidade</h2>
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Matrizes Próximas ao Parto</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead>
                <TableHead>DPP</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prenhes.map((r) => {
                const a = state.animais.find((x) => x.id === r.animalId)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold text-lg">{a?.brinco}</TableCell>
                    <TableCell className="text-slate-600">
                      {format(parseISO(r.dpp), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="lg"
                        onClick={() => {
                          setSelectedRepro(r)
                          setOpen(true)
                        }}
                        className="bg-emerald-800 rounded-lg shadow font-semibold"
                      >
                        Registrar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {prenhes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
                    Nenhuma matriz prenhe registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-emerald-900">Registrar Nascimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <label className="text-base font-semibold text-emerald-950">
                Peso ao Nascer (Kg)
              </label>
              <Input
                type="number"
                placeholder="Ex: 35"
                className="h-16 text-2xl text-center rounded-xl font-mono bg-slate-50 border-slate-200"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-base font-semibold text-emerald-950">Sexo do Bezerro</label>
              <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                <SelectTrigger className="h-16 text-xl rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M" className="text-lg py-3">
                    Macho
                  </SelectItem>
                  <SelectItem value="F" className="text-lg py-3">
                    Fêmea
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRegistrar}
              className="w-full h-16 text-xl font-bold bg-emerald-800 rounded-xl mt-4 active:scale-[0.98] transition-transform"
            >
              Salvar Bezerro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
