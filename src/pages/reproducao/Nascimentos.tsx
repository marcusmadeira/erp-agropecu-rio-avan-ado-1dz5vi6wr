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
      return { ...s, reproducoes: repros, animais: [...s.animais, novoBezerro] }
    })
    setOpen(false)
    toast({
      title: 'Nascimento Registrado',
      description: 'Bezerro criado e herdou genealogia da mãe.',
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-emerald-900">Nascimentos e Desmame</h2>
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Matrizes Próximas ao Parto</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                    <TableCell className="font-bold">{a?.brinco}</TableCell>
                    <TableCell>{format(parseISO(r.dpp), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRepro(r)
                          setOpen(true)
                        }}
                        className="bg-emerald-800"
                      >
                        Registrar Parto
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {prenhes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma matriz prenhe.
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
            <DialogTitle>Registrar Nascimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="number"
              placeholder="Peso ao Nascer (Kg)"
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
            />
            <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Macho</SelectItem>
                <SelectItem value="F">Fêmea</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRegistrar} className="w-full bg-emerald-800">
              Salvar e Criar Ficha do Bezerro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
