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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, FileText, Plus } from 'lucide-react'
import { exportAnimalPDF } from '@/lib/pdf'

export default function Animais() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    brinco: '',
    rgn: '',
    nomeAnimal: '',
    loteId: '',
    categoria: 'Matriz PO',
    pesoAtual: '',
    costCenter: 'CC01-PO',
    gender: 'F',
    pai: 'none',
    mae: 'none',
  })

  const filtered = state.animais.filter(
    (a) =>
      a.brinco.includes(search) ||
      (a.rgn && a.rgn.includes(search)) ||
      (a.nomeAnimal && a.nomeAnimal.toLowerCase().includes(search.toLowerCase())),
  )

  const matrizes = state.animais.filter((a) => a.gender === 'F' && a.status === 'Ativo')
  const touros = state.animais.filter((a) => a.gender === 'M' && a.status === 'Ativo')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.brinco || !form.loteId || !form.pesoAtual) return
    const newId = Math.random().toString()
    const peso = Number(form.pesoAtual)

    dispatch((s) => ({
      ...s,
      animais: [
        {
          ...form,
          id: newId,
          pesoAtual: peso,
          pesoEntrada: peso,
          gmd: 0,
          status: 'Ativo',
          birthDate: new Date().toISOString(),
          pai: form.pai === 'none' ? undefined : form.pai,
          mae: form.mae === 'none' ? undefined : form.mae,
          custoAcumulado: 0,
        } as any,
        ...s.animais,
      ],
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Create',
          table: 'Animais',
          recordId: form.brinco,
          oldValue: '-',
          newValue: `Cadastrado: ${peso}kg`,
        },
        ...s.auditLogs,
      ],
    }))
    toast({ title: 'Animal Cadastrado', description: `Brinco ${form.brinco} salvo.` })
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-primary">Plantel e Rastreabilidade</h2>
        <div className="flex items-center space-x-2 relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            className="pl-9 w-full sm:w-64"
            placeholder="Buscar Brinco / RGN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="w-4 h-4 mr-2" /> Novo Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Animal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Brinco (ID)</Label>
                    <Input
                      required
                      value={form.brinco}
                      onChange={(e) => setForm({ ...form, brinco: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>RGD/RGN</Label>
                    <Input
                      value={form.rgn}
                      onChange={(e) => setForm({ ...form, rgn: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria Oficial</Label>
                    <Select
                      value={form.categoria}
                      onValueChange={(v) => setForm({ ...form, categoria: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matriz PO">Matriz PO</SelectItem>
                        <SelectItem value="Touro PO">Touro PO</SelectItem>
                        <SelectItem value="Bezerro PO">Bezerro PO</SelectItem>
                        <SelectItem value="Bezerra PO">Bezerra PO</SelectItem>
                        <SelectItem value="Novilha TIP">Novilha TIP</SelectItem>
                        <SelectItem value="Garrote TIP">Garrote TIP</SelectItem>
                        <SelectItem value="Vaca Descarte TIP">Vaca Descarte TIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lote</Label>
                    <Select
                      required
                      value={form.loteId}
                      onValueChange={(v) => setForm({ ...form, loteId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {state.lotes.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Peso Entrada (Kg)</Label>
                    <Input
                      required
                      type="number"
                      value={form.pesoAtual}
                      onChange={(e) => setForm({ ...form, pesoAtual: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Centro de Custo</Label>
                    <Select
                      value={form.costCenter}
                      onValueChange={(v) => setForm({ ...form, costCenter: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC01-PO">PO (Elite)</SelectItem>
                        <SelectItem value="CC02-TIP">TIP (Comercial)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pai (Touro)</Label>
                    <Select value={form.pai} onValueChange={(v) => setForm({ ...form, pai: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {touros.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.brinco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mãe (Matriz)</Label>
                    <Select value={form.mae} onValueChange={(v) => setForm({ ...form, mae: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {matrizes.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.brinco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary mt-2">
                  Salvar Cadastro
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
                <TableHead>Brinco</TableHead>
                <TableHead>Nome / RGN</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Genealogia</TableHead>
                <TableHead className="text-right">Peso / GMD</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const pai = state.animais.find((x) => x.id === a.pai)
                const mae = state.animais.find((x) => x.id === a.mae)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold">{a.brinco}</TableCell>
                    <TableCell>
                      <div className="font-medium">{a.nomeAnimal || '-'}</div>
                      <div className="text-[10px] text-muted-foreground">{a.rgn || 'S/ RGN'}</div>
                    </TableCell>
                    <TableCell>
                      {state.lotes.find((l) => l.id === a.loteId)?.name || '-'}
                      <div className="mt-1">
                        <Badge
                          variant={a.costCenter === 'CC01-PO' ? 'default' : 'secondary'}
                          className="text-[9px] px-1.5"
                        >
                          {a.costCenter}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.categoria}
                      <span className="block text-[10px] text-muted-foreground">{a.status}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      P: {pai?.brinco || '-'} <br />
                      M: {mae?.brinco || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-primary">
                      {a.pesoAtual} kg
                      <span className="block text-[10px] text-muted-foreground">
                        {a.gmd.toFixed(3)} GMD
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => exportAnimalPDF(a, state)}>
                        <FileText className="w-4 h-4 text-primary" />
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
