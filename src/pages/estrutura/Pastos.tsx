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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function Pastos() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '', status: 'Livre' as any })

  const handleSave = () => {
    dispatch((s) => ({
      ...s,
      pastos: [
        ...s.pastos,
        {
          id: Math.random().toString(),
          name: form.name,
          capacity: Number(form.capacity),
          status: form.status,
          grassHeight: 30,
        },
      ],
    }))
    setOpen(false)
    toast({ title: 'Pasto criado com sucesso!' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-900">Gestão de Pastos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-800 hover:bg-emerald-900">Novo Pasto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Pasto / Piquete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Nome do Pasto"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Capacidade (Cabeças)"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Livre">Livre</SelectItem>
                  <SelectItem value="Ocupado">Ocupado</SelectItem>
                  <SelectItem value="Em Descanso">Em Descanso</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="w-full bg-emerald-800 hover:bg-emerald-900">
                Salvar
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
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lote Atual</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Altura Pastagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.pastos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'Livre'
                          ? 'default'
                          : p.status === 'Ocupado'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.loteId ? state.lotes.find((l) => l.id === p.loteId)?.name : '-'}
                  </TableCell>
                  <TableCell>{p.capacity} cabeças</TableCell>
                  <TableCell>{p.grassHeight} cm</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
