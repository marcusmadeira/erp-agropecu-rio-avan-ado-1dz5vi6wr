import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Pasto } from '@/stores/types'
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
import { Edit2, Plus, Map, Users, TrendingUp } from 'lucide-react'

const SuggestionBadge = ({ p }: { p: Pasto }) => {
  if (p.taxaLotacao > p.capacity)
    return <Badge className="bg-rose-500 hover:bg-rose-600">Alerta - Superlotação</Badge>
  if (p.grassHeight <= p.minExitHeight && p.taxaLotacao > 0)
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 animate-pulse">
        Necessário Rotacionar - Pasto Baixo
      </Badge>
    )
  if (p.grassHeight >= p.idealEntryHeight && p.taxaLotacao === 0)
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Ideal para Entrada</Badge>
  if (p.taxaLotacao > 0)
    return <Badge className="bg-blue-500 hover:bg-blue-600">Pasto em Uso</Badge>
  return <Badge variant="secondary">Em Recuperação</Badge>
}

export default function Pastos() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Pasto>>({
    name: '',
    capacity: 50,
    status: 'Livre',
    grassHeight: 30,
    area: 10,
    taxaLotacao: 0,
    idealEntryHeight: 35,
    minExitHeight: 20,
  })

  const totalArea = state.pastos.reduce((a, p) => a + (p.area || 0), 0)
  const totalUA = state.pastos.reduce((a, p) => a + (p.taxaLotacao || 0), 0)
  const avgStocking = totalArea > 0 ? (totalUA / totalArea).toFixed(2) : '0.00'
  const readyCount = state.pastos.filter(
    (p) => p.taxaLotacao === 0 && p.grassHeight >= p.idealEntryHeight,
  ).length

  const openNew = () => {
    setEditingId(null)
    setForm({
      name: '',
      capacity: 50,
      status: 'Livre',
      grassHeight: 30,
      area: 10,
      taxaLotacao: 0,
      idealEntryHeight: 35,
      minExitHeight: 20,
    })
    setOpen(true)
  }

  const openEdit = (p: Pasto) => {
    setEditingId(p.id)
    setForm(p)
    setOpen(true)
  }

  const handleSave = () => {
    dispatch((s) => {
      if (editingId) {
        return {
          ...s,
          pastos: s.pastos.map((p) => (p.id === editingId ? ({ ...p, ...form } as Pasto) : p)),
        }
      } else {
        return { ...s, pastos: [...s.pastos, { ...form, id: Math.random().toString() } as Pasto] }
      }
    })
    setOpen(false)
    toast({ title: editingId ? 'Piquete atualizado!' : 'Piquete cadastrado com sucesso!' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">
            Módulo de Gestão de Pastagens Dinâmica
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitore e rotacione pastos baseado em métricas reais.
          </p>
        </div>
        <Button onClick={openNew} className="bg-emerald-800 hover:bg-emerald-900">
          <Plus className="w-4 h-4 mr-2" /> Novo Piquete
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Área Total de Pastagem
            </CardTitle>
            <Map className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{totalArea} ha</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Lotação Média (UA/ha)
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{avgStocking}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Piquetes Prontos p/ Uso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{readyCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead className="text-right">Área do Piquete</TableHead>
                <TableHead className="text-right">Lotação Atual</TableHead>
                <TableHead className="text-right">Altura do Capim</TableHead>
                <TableHead>Sugestão de Rotatividade</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.pastos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-slate-800">{p.name}</TableCell>
                  <TableCell className="text-right text-slate-600">{p.area} ha</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {p.taxaLotacao} / {p.capacity}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {p.grassHeight} cm
                  </TableCell>
                  <TableCell>
                    <SuggestionBadge p={p} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(p)}
                      className="text-emerald-700"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Atualizar Métricas do Piquete' : 'Cadastrar Piquete'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Nome do Piquete</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Status de Uso</label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Livre">Livre</SelectItem>
                  <SelectItem value="Ocupado">Ocupado</SelectItem>
                  <SelectItem value="Em Descanso">Em Descanso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Área do Piquete (ha)</label>
              <Input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Taxa de Lotação (Atual)</label>
              <Input
                type="number"
                value={form.taxaLotacao}
                onChange={(e) => setForm({ ...form, taxaLotacao: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura do Capim (cm)</label>
              <Input
                type="number"
                value={form.grassHeight}
                onChange={(e) => setForm({ ...form, grassHeight: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Capacidade Suportada Max</label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura Ideal p/ Entrada (cm)</label>
              <Input
                type="number"
                value={form.idealEntryHeight}
                onChange={(e) => setForm({ ...form, idealEntryHeight: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura Mínima p/ Saída (cm)</label>
              <Input
                type="number"
                value={form.minExitHeight}
                onChange={(e) => setForm({ ...form, minExitHeight: Number(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full bg-emerald-800 hover:bg-emerald-900 mt-4">
            {editingId ? 'Salvar Alterações' : 'Criar Piquete'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
