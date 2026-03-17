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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { FileText } from 'lucide-react'
import { exportLotePDF } from '@/lib/pdf'

export default function Lotes() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', costCenter: 'CC01-PO' as any })

  const handleSave = () => {
    dispatch((s) => ({
      ...s,
      lotes: [
        ...s.lotes,
        { id: Math.random().toString(), name: form.name, costCenter: form.costCenter },
      ],
    }))
    setOpen(false)
    toast({ title: 'Lote criado com sucesso!' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-900">Manejo de Lotes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-800">Novo Lote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Lote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Nome do Lote"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Select
                value={form.costCenter}
                onValueChange={(v) => setForm({ ...form, costCenter: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Centro de Custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC01-PO">CC01-PO (Nelore Puro)</SelectItem>
                  <SelectItem value="CC02-TIP">CC02-TIP (Comercial/Engorda)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} className="w-full bg-emerald-800">
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
                <TableHead>Nome do Lote</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead className="text-right">Qtd. Cabeças</TableHead>
                <TableHead className="text-right">Peso Médio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.lotes.map((l) => {
                const animals = state.animais.filter(
                  (a) => a.loteId === l.id && a.status === 'Ativo',
                )
                const avgWeight =
                  animals.length > 0
                    ? animals.reduce((acc, a) => acc + a.pesoAtual, 0) / animals.length
                    : 0
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold">{l.name}</TableCell>
                    <TableCell>
                      <Badge variant={l.costCenter === 'CC01-PO' ? 'default' : 'secondary'}>
                        {l.costCenter}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{animals.length}</TableCell>
                    <TableCell className="text-right font-mono">
                      {avgWeight.toFixed(1)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportLotePDF(l, state.animais, state.pastos)}
                        title="Exportar Relatório PDF"
                      >
                        <FileText className="w-4 h-4 mr-2 text-emerald-700" /> Relatório
                      </Button>
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
