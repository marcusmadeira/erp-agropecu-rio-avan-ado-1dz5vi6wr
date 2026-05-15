import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getMetas, createMeta, deleteMeta, updateMeta } from '@/services/metas'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, BarChart3, CheckCircle2, Trash2, Pencil, X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface Meta {
  id: string
  tipo_meta: string
  valor_meta: number
  periodo: string
  data_inicio: string
  data_fim: string
}

const TIPOS_META = ['Custo @', 'Taxa Prenhez', 'GMD', 'Idade Abate', 'Lotação']

export default function MetasKPIs() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    tipo_meta: '',
    valor_meta: '',
    periodo: '',
    data_inicio: '',
    data_fim: '',
  })

  const [actuals, setActuals] = useState<Record<string, number>>({
    'Custo @': 0,
    'Taxa Prenhez': 0,
    GMD: 0,
    'Idade Abate': 0,
    Lotação: 0,
  })

  const loadData = async () => {
    try {
      const data = await getMetas()
      setMetas(data as Meta[])

      const iatf = await pb.collection('manejo_iatf_curral').getFullList()
      const prenhes = iatf.filter((i) => i.resultado_dg === 'Prenhe').length
      const txPrenhez = iatf.length ? (prenhes / iatf.length) * 100 : 0

      const pesagens = await pb.collection('pesagens_diarias').getFullList()
      const validGmd = pesagens.filter((p) => p.gmd_calculado > 0)
      const gmd = validGmd.length
        ? validGmd.reduce((acc, p) => acc + p.gmd_calculado, 0) / validGmd.length
        : 0

      const animais = await pb.collection('animais').getList(1, 1)
      const totalAnimais = animais.totalItems
      const pastos = await pb.collection('pastos_e_piquetes').getFullList()
      const totalArea = pastos.reduce((acc, p) => acc + (p.area_hectares || 0), 0) || 1000
      const lotacao = totalAnimais / totalArea

      const despesas = await pb.collection('pagamentos_realizados').getFullList()
      const totalDespesas = despesas.reduce((acc, t) => acc + (t.valor_pago || 0), 0)

      const vendas = await pb.collection('vendas').getFullList()
      const animaisVendidos = vendas.reduce((acc, v) => acc + v.quantidade_animais, 0) || 100

      // 1 Arroba = exactly 15 kg
      const arrobas = animaisVendidos * 15
      const custo = arrobas > 0 ? totalDespesas / arrobas : 0

      setActuals({
        'Custo @': custo,
        'Taxa Prenhez': txPrenhez,
        GMD: gmd,
        'Idade Abate': 30, // Mock for Idade Abate as there is no specific abate collection yet
        Lotação: lotacao,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro de Comunicação',
        description: 'Não foi possível carregar as métricas.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleEdit = (m: Meta) => {
    setEditId(m.id)
    setFormData({
      tipo_meta: m.tipo_meta,
      valor_meta: m.valor_meta.toString(),
      periodo: m.periodo || '',
      data_inicio: m.data_inicio ? m.data_inicio.substring(0, 10) : '',
      data_fim: m.data_fim ? m.data_fim.substring(0, 10) : '',
    })
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setFormData({ tipo_meta: '', valor_meta: '', periodo: '', data_inicio: '', data_fim: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo_meta || !formData.valor_meta) {
      toast({
        title: 'Erro',
        description: 'Preencha o tipo e o valor da meta.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const payload = {
      tipo_meta: formData.tipo_meta,
      valor_meta: parseFloat(formData.valor_meta),
      periodo: formData.periodo,
      data_inicio: formData.data_inicio ? new Date(formData.data_inicio).toISOString() : null,
      data_fim: formData.data_fim ? new Date(formData.data_fim).toISOString() : null,
    }
    try {
      if (editId) {
        await updateMeta(editId, payload)
        toast({ title: 'Sucesso', description: 'Meta atualizada com sucesso!' })
      } else {
        await createMeta(payload)
        toast({ title: 'Sucesso', description: 'Meta criada com sucesso!' })
      }
      handleCancelEdit()
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao processar meta.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta meta?')) return
    try {
      await deleteMeta(id)
      toast({ title: 'Sucesso', description: 'Meta excluída.' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao excluir meta.', variant: 'destructive' })
    }
  }

  const renderDashboardCard = (meta: Meta) => {
    const actual = actuals[meta.tipo_meta] || 0
    let isHigherBetter = true
    if (meta.tipo_meta === 'Custo @' || meta.tipo_meta === 'Idade Abate') {
      isHigherBetter = false
    }

    let progress = 0
    let isGood = false

    if (isHigherBetter) {
      progress = meta.valor_meta > 0 ? (actual / meta.valor_meta) * 100 : 0
      isGood = actual >= meta.valor_meta
    } else {
      progress = actual > 0 ? (meta.valor_meta / actual) * 100 : 0
      if (progress > 100) progress = 100
      isGood = actual <= meta.valor_meta
    }

    progress = Math.min(100, Math.max(0, progress))

    const formatValue = (val: number) => {
      if (meta.tipo_meta === 'Custo @') return `R$ ${val.toFixed(2)}`
      if (meta.tipo_meta === 'Taxa Prenhez') return `${val.toFixed(1)}%`
      if (meta.tipo_meta === 'GMD') return `${val.toFixed(3)} kg/dia`
      if (meta.tipo_meta === 'Lotação') return `${val.toFixed(2)} UA/ha`
      return val.toFixed(1)
    }

    return (
      <Card
        key={meta.id}
        className={`border-l-4 ${isGood ? 'border-l-green-500' : 'border-l-red-500'}`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{meta.tipo_meta}</CardTitle>
            {isGood ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <CardDescription>
            {meta.periodo || 'Sem período'}{' '}
            {meta.data_fim ? `- Fim: ${new Date(meta.data_fim).toLocaleDateString()}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Real: <strong className="text-foreground">{formatValue(actual)}</strong>
              </span>
              <span className="text-muted-foreground">
                Alvo: <strong className="text-foreground">{formatValue(meta.valor_meta)}</strong>
              </span>
            </div>
            <Progress
              value={progress}
              className={isGood ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}
            />
            {!isGood && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                Atenção: Meta fora do esperado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#094016]">Metas e KPIs</h1>
          <p className="text-muted-foreground">Gestão de metas produtivas e financeiras.</p>
        </div>
        <BarChart3 className="w-10 h-10 text-[#094016] opacity-80" />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Comparativo: Previsto vs Realizado</TabsTrigger>
          <TabsTrigger value="gestao">Gerenciar Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {metas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhuma meta configurada no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metas.map(renderDashboardCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gestao">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit border-[#094016]/20">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{editId ? 'Editar Meta' : 'Nova Meta'}</CardTitle>
                {editId && (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Meta</Label>
                    <Select
                      onValueChange={(val) => setFormData({ ...formData, tipo_meta: val })}
                      value={formData.tipo_meta}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o KPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_META.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Meta</Label>
                    <Input
                      name="valor_meta"
                      type="number"
                      step="0.01"
                      value={formData.valor_meta}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período (Ex: Safra 26/27)</Label>
                    <Input name="periodo" value={formData.periodo} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        name="data_inicio"
                        type="date"
                        value={formData.data_inicio}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        name="data_fim"
                        type="date"
                        value={formData.data_fim}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#094016] hover:bg-[#094016]/90"
                    disabled={loading}
                  >
                    {editId ? 'Atualizar Meta' : 'Salvar Meta'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Listagem de Metas</CardTitle>
              </CardHeader>
              <CardContent>
                {metas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma meta configurada.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metas.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div>
                          <p className="font-semibold text-lg">{m.tipo_meta}</p>
                          <p className="text-sm text-muted-foreground">
                            {m.periodo || 'N/A'} | Início:{' '}
                            {m.data_inicio ? new Date(m.data_inicio).toLocaleDateString() : '-'} |
                            Fim: {m.data_fim ? new Date(m.data_fim).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-[#094016]">Alvo: {m.valor_meta}</p>
                          <div className="flex">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
