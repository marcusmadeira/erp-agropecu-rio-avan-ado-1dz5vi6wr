import { useState, useEffect } from 'react'
import { getPastos, createPasto, updatePasto } from '@/services/pastos'
import { useRealtime } from '@/hooks/use-realtime'
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
import { Edit2, Plus, Map as MapIcon, Users, TrendingUp, Loader2 } from 'lucide-react'

const SuggestionBadge = ({ p }: { p: any }) => {
  const taxa = p.taxa_lotacao_atual || 0
  const cap = p.capacidade || 50
  const altura = p.altura_capim_cm || 0
  const minSaida = p.altura_minima_saida_cm || 0
  const idealEntrada = p.altura_ideal_entrada_cm || 0

  if (taxa > cap)
    return <Badge className="bg-rose-500 hover:bg-rose-600">Alerta - Superlotação</Badge>
  if (altura <= minSaida && taxa > 0)
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 animate-pulse">
        Necessário Rotacionar - Pasto Baixo
      </Badge>
    )
  if (altura >= idealEntrada && taxa === 0)
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Ideal para Entrada</Badge>
  if (taxa > 0) return <Badge className="bg-blue-500 hover:bg-blue-600">Pasto em Uso</Badge>
  return <Badge variant="secondary">Em Recuperação</Badge>
}

export default function Pastos() {
  const { toast } = useToast()
  const [pastos, setPastos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<any>({
    nome: '',
    capacidade: 50,
    status_ocupacao: 'Livre',
    altura_capim_cm: 30,
    area_hectares: 10,
    taxa_lotacao_atual: 0,
    altura_ideal_entrada_cm: 35,
    altura_minima_saida_cm: 20,
  })

  const loadData = async () => {
    try {
      const data = await getPastos()
      setPastos(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar pastagens', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('pastos_e_piquetes', loadData)

  const totalArea = pastos.reduce((a, p) => a + (p.area_hectares || 0), 0)
  const totalUA = pastos.reduce((a, p) => a + (p.taxa_lotacao_atual || 0), 0)
  const avgStocking = totalArea > 0 ? (totalUA / totalArea).toFixed(2) : '0.00'
  const readyCount = pastos.filter(
    (p) =>
      (p.taxa_lotacao_atual || 0) === 0 &&
      (p.altura_capim_cm || 0) >= (p.altura_ideal_entrada_cm || 0),
  ).length

  const openNew = () => {
    setEditingId(null)
    setForm({
      nome: '',
      capacidade: 50,
      status_ocupacao: 'Livre',
      altura_capim_cm: 30,
      area_hectares: 10,
      taxa_lotacao_atual: 0,
      altura_ideal_entrada_cm: 35,
      altura_minima_saida_cm: 20,
    })
    setOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      nome: p.nome || '',
      capacidade: p.capacidade || 0,
      status_ocupacao: p.status_ocupacao || 'Livre',
      altura_capim_cm: p.altura_capim_cm || 0,
      area_hectares: p.area_hectares || 0,
      taxa_lotacao_atual: p.taxa_lotacao_atual || 0,
      altura_ideal_entrada_cm: p.altura_ideal_entrada_cm || 0,
      altura_minima_saida_cm: p.altura_minima_saida_cm || 0,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.nome) {
      toast({ title: 'Nome do piquete é obrigatório', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updatePasto(editingId, form)
        toast({ title: 'Piquete atualizado!' })
      } else {
        await createPasto(form)
        toast({ title: 'Piquete cadastrado com sucesso!' })
      }
      setOpen(false)
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
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
            <MapIcon className="h-4 w-4 text-emerald-700" />
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando pastagens...
                  </TableCell>
                </TableRow>
              ) : pastos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum piquete cadastrado no sistema.
                  </TableCell>
                </TableRow>
              ) : (
                pastos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-slate-800">{p.nome}</TableCell>
                    <TableCell className="text-right text-slate-600">
                      {p.area_hectares || 0} ha
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {p.taxa_lotacao_atual || 0} / {p.capacidade || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {p.altura_capim_cm || 0} cm
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
                ))
              )}
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
              <label className="text-xs font-semibold">Nome do Piquete *</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Status de Uso</label>
              <Select
                value={form.status_ocupacao}
                onValueChange={(v) => setForm({ ...form, status_ocupacao: v })}
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
                value={form.area_hectares}
                onChange={(e) => setForm({ ...form, area_hectares: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Taxa de Lotação (Atual)</label>
              <Input
                type="number"
                value={form.taxa_lotacao_atual}
                onChange={(e) => setForm({ ...form, taxa_lotacao_atual: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura do Capim (cm)</label>
              <Input
                type="number"
                value={form.altura_capim_cm}
                onChange={(e) => setForm({ ...form, altura_capim_cm: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Capacidade Suportada Max</label>
              <Input
                type="number"
                value={form.capacidade}
                onChange={(e) => setForm({ ...form, capacidade: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura Ideal p/ Entrada (cm)</label>
              <Input
                type="number"
                value={form.altura_ideal_entrada_cm}
                onChange={(e) =>
                  setForm({ ...form, altura_ideal_entrada_cm: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Altura Mínima p/ Saída (cm)</label>
              <Input
                type="number"
                value={form.altura_minima_saida_cm}
                onChange={(e) =>
                  setForm({ ...form, altura_minima_saida_cm: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-800 hover:bg-emerald-900 mt-4"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {editingId ? 'Salvar Alterações' : 'Criar Piquete'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
