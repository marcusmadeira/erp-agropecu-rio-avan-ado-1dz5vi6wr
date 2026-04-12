import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Minus, DollarSign, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useToast } from '@/components/ui/use-toast'
import {
  getPrecosMercado,
  createPrecoMercado,
  deletePrecoMercado,
  getAnaliseTendencia,
} from '@/services/mercado'
import { useRealtime } from '@/hooks/use-realtime'

export default function Mercado() {
  const [precos, setPrecos] = useState<any[]>([])
  const [analise, setAnalise] = useState<any>(null)
  const [formData, setFormData] = useState({
    data_registro: '',
    preco_arroba: '',
    preco_milho: '',
    preco_farelo_soja: '',
    fonte: '',
  })

  const [showArroba, setShowArroba] = useState(true)
  const [showMilho, setShowMilho] = useState(true)
  const [showSoja, setShowSoja] = useState(true)

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getPrecosMercado()
      setPrecos(data)
      const res = await getAnaliseTendencia()
      setAnalise(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('precos_mercado', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPrecoMercado({
        data_registro: new Date(formData.data_registro).toISOString(),
        preco_arroba: Number(formData.preco_arroba),
        preco_milho: Number(formData.preco_milho),
        preco_farelo_soja: Number(formData.preco_farelo_soja),
        fonte: formData.fonte,
        regiao: 'Maranhão',
      })
      toast({ title: 'Sucesso', description: 'Registro de preços salvo.' })
      setFormData({
        data_registro: '',
        preco_arroba: '',
        preco_milho: '',
        preco_farelo_soja: '',
        fonte: '',
      })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await deletePrecoMercado(id)
        toast({ title: 'Sucesso', description: 'Registro excluído.' })
      } catch {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  const chartData = useMemo(() => {
    return [...precos].reverse().map((p) => ({
      date: format(parseISO(p.data_registro), 'dd/MMM', { locale: ptBR }),
      arroba: p.preco_arroba,
      milho: p.preco_milho,
      soja: p.preco_farelo_soja,
    }))
  }, [precos])

  const stats = useMemo(() => {
    if (!precos.length) return null
    const current = precos[0]
    const previous = precos.length > 1 ? precos[1] : current

    const calcStat = (key: string) => {
      const vals = precos.map((p) => p[key])
      const max = Math.max(...vals)
      const min = Math.min(...vals)
      const varPct = previous[key] ? ((current[key] - previous[key]) / previous[key]) * 100 : 0
      return { current: current[key], max, min, varPct }
    }

    return {
      arroba: calcStat('preco_arroba'),
      milho: calcStat('preco_milho'),
      soja: calcStat('preco_farelo_soja'),
    }
  }, [precos])

  const chartConfig = {
    arroba: { label: 'Arroba Boi (R$)', color: '#ef4444' },
    milho: { label: 'Milho (R$)', color: '#f59e0b' },
    soja: { label: 'Farelo Soja (R$)', color: 'hsl(var(--primary))' },
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'Tendência de Alta') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'Baixa') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#094016]">
            Monitoramento de Mercado
          </h2>
          <p className="text-muted-foreground">
            Acompanhe preços, tendências e tome decisões estratégicas no Maranhão.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Arroba do Boi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.arroba.current.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.arroba.varPct >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={stats.arroba.varPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.arroba.varPct.toFixed(2)}%
                </span>
                vs último registro (Min: {stats.arroba.min} / Max: {stats.arroba.max})
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saca Milho (60kg)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.milho.current.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.milho.varPct >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={stats.milho.varPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.milho.varPct.toFixed(2)}%
                </span>
                vs último registro (Min: {stats.milho.min} / Max: {stats.milho.max})
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Farelo Soja (Ton)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.soja.current.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.soja.varPct >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={stats.soja.varPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.soja.varPct.toFixed(2)}%
                </span>
                vs último registro (Min: {stats.soja.min} / Max: {stats.soja.max})
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analise && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50 border-[#094016]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tendência Arroba (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendIcon trend={analise.tendencias.arroba} />
                  <span className="font-medium">{analise.tendencias.arroba}</span>
                </div>
                <div className="text-sm">Previsto: R$ {analise.forecast.arroba.toFixed(2)}</div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#094016] text-white">
                Recomendação: {analise.recommendations.arroba}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-[#094016]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tendência Milho (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendIcon trend={analise.tendencias.milho} />
                  <span className="font-medium">{analise.tendencias.milho}</span>
                </div>
                <div className="text-sm">Previsto: R$ {analise.forecast.milho.toFixed(2)}</div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#094016] text-white">
                Recomendação: {analise.recommendations.milho}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-[#094016]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tendência Soja (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendIcon trend={analise.tendencias.soja} />
                  <span className="font-medium">{analise.tendencias.soja}</span>
                </div>
                <div className="text-sm">Previsto: R$ {analise.forecast.soja.toFixed(2)}</div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#094016] text-white">
                Recomendação: {analise.recommendations.soja}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Registrar Preços (Maranhão)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Data do Registro</Label>
                <Input
                  type="date"
                  required
                  value={formData.data_registro}
                  onChange={(e) => setFormData({ ...formData, data_registro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Arroba do Boi Gordo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.preco_arroba}
                  onChange={(e) => setFormData({ ...formData, preco_arroba: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Milho (R$/Sc 60kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.preco_milho}
                  onChange={(e) => setFormData({ ...formData, preco_milho: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Farelo Soja (R$/Ton)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.preco_farelo_soja}
                  onChange={(e) => setFormData({ ...formData, preco_farelo_soja: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Input
                  type="text"
                  placeholder="Ex: CEPEA, Scot Consultoria"
                  value={formData.fonte}
                  onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-[#094016] hover:bg-[#094016]/90">
                Salvar Registro
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Evolução de Preços (12 meses)</CardTitle>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="showArroba" checked={showArroba} onCheckedChange={setShowArroba} />
                  <Label htmlFor="showArroba">Arroba</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="showMilho" checked={showMilho} onCheckedChange={setShowMilho} />
                  <Label htmlFor="showMilho">Milho</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="showSoja" checked={showSoja} onCheckedChange={setShowSoja} />
                  <Label htmlFor="showSoja">Soja</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {showArroba && (
                    <Line
                      type="monotone"
                      dataKey="arroba"
                      stroke="var(--color-arroba)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {showMilho && (
                    <Line
                      type="monotone"
                      dataKey="milho"
                      stroke="var(--color-milho)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {showSoja && (
                    <Line
                      type="monotone"
                      dataKey="soja"
                      stroke="var(--color-soja)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arroba (R$)</TableHead>
                <TableHead>Milho (R$)</TableHead>
                <TableHead>Soja (R$)</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {precos.slice(0, 10).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{format(parseISO(p.data_registro), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{p.preco_arroba}</TableCell>
                  <TableCell>{p.preco_milho}</TableCell>
                  <TableCell>{p.preco_farelo_soja}</TableCell>
                  <TableCell>{p.fonte || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {precos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
