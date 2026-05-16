import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from 'recharts'
import {
  AlertCircle,
  Beef,
  TrendingUp,
  Scale,
  DollarSign,
  Activity,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

import { getLotes } from '@/services/lotes'
import { getAnimais } from '@/services/animais'
import { getTratoDiarioLotes } from '@/services/trato_diario_lotes'
import { getPesagens } from '@/services/pesagens'
import { getPastos } from '@/services/pastos'
import { getFormulacoes } from '@/services/formulacoes_racao'
import { createAuditoria } from '@/services/auditoria'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
const formatNumber = (val: number, decimals: number = 2) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)

export function ConsumoDesempenhoTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loteId, setLoteId] = useState('all')
  const [categoria, setCategoria] = useState('all')
  const [pastoId, setPastoId] = useState('all')
  const [formulacaoId, setFormulacaoId] = useState('all')
  const [subTab, setSubTab] = useState('lotes')

  const [data, setData] = useState({
    lotes: [] as any[],
    animais: [] as any[],
    tratos: [] as any[],
    pesagens: [] as any[],
    pastos: [] as any[],
    formulacoes: [] as any[],
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [lotes, animais, tratos, pesagens, pastos, formulacoes] = await Promise.all([
          getLotes(),
          getAnimais(),
          getTratoDiarioLotes(),
          getPesagens(),
          getPastos(),
          getFormulacoes(),
        ])
        setData({ lotes, animais, tratos, pesagens, pastos, formulacoes })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredTratos = useMemo(() => {
    return data.tratos.filter((t) => {
      if (dateFrom && t.data < dateFrom) return false
      if (dateTo && t.data > dateTo) return false
      if (loteId !== 'all' && t.lote_id !== loteId) return false
      if (formulacaoId !== 'all' && t.formulacao_id !== formulacaoId) return false
      return true
    })
  }, [data.tratos, dateFrom, dateTo, loteId, formulacaoId])

  const filteredPesagens = useMemo(() => {
    return data.pesagens.filter((p) => {
      if (dateFrom && p.data_pesagem < dateFrom) return false
      if (dateTo && p.data_pesagem > dateTo) return false
      return true
    })
  }, [data.pesagens, dateFrom, dateTo])

  const filteredAnimais = useMemo(() => {
    return data.animais.filter((a) => {
      if (loteId !== 'all' && a.lote_atual_id !== loteId) return false
      if (categoria !== 'all' && a.categoria !== categoria) return false
      if (pastoId !== 'all' && a.piquete_atual_id !== pastoId) return false
      return true
    })
  }, [data.animais, loteId, categoria, pastoId])

  const lotesMetrics = useMemo(() => {
    return data.lotes
      .map((lote) => {
        const tratos = filteredTratos.filter((t) => t.lote_id === lote.id)
        const feedConsumed = tratos.reduce((acc, t) => acc + (t.quantidade_kg_servida || 0), 0)
        const feedCost = tratos.reduce((acc, t) => acc + (t.custo_total_trato || 0), 0)

        const animaisLot = filteredAnimais.filter((a) => a.lote_atual_id === lote.id)

        let totalGain = 0
        let sumGmd = 0
        let countGmd = 0

        const animalMetrics = animaisLot.map((a) => {
          const pes = filteredPesagens
            .filter((p) => p.animal_id === a.id)
            .sort((x, y) => x.data_pesagem.localeCompare(y.data_pesagem))
          let gain = 0
          let gmd = 0
          if (pes.length > 1) {
            const first = pes[0]
            const last = pes[pes.length - 1]
            gain = last.peso_kg - first.peso_kg
            const days =
              (new Date(last.data_pesagem).getTime() - new Date(first.data_pesagem).getTime()) /
              (1000 * 3600 * 24)
            if (days > 0) {
              gmd = gain / days
              sumGmd += gmd
              countGmd++
            }
          }
          totalGain += gain
          return {
            id: a.id,
            brinco: a.id_manejo_brinco,
            categoria: a.categoria,
            gain,
            gmd,
            firstWeight: pes.length > 0 ? pes[0].peso_kg : a.peso_atual_kg,
            lastWeight: pes.length > 0 ? pes[pes.length - 1].peso_kg : a.peso_atual_kg,
            pesagensCount: pes.length,
          }
        })

        const avgGmd = countGmd > 0 ? sumGmd / countGmd : 0
        const avgConsumptionPerHead = animaisLot.length > 0 ? feedConsumed / animaisLot.length : 0
        const fcr = totalGain > 0 ? feedConsumed / totalGain : 0
        const arrobasProduced = totalGain / 30
        const costPerArroba = arrobasProduced > 0 ? feedCost / arrobasProduced : 0
        const missingCosts = tratos.some((t) => !t.custo_total_trato || t.custo_total_trato === 0)

        return {
          ...lote,
          feedConsumed,
          feedCost,
          animaisCount: animaisLot.length,
          totalGain,
          avgGmd,
          avgConsumptionPerHead,
          fcr,
          arrobasProduced,
          costPerArroba,
          missingCosts,
          animalMetrics,
        }
      })
      .filter((l) => l.animaisCount > 0 || l.feedConsumed > 0)
  }, [data.lotes, filteredAnimais, filteredTratos, filteredPesagens])

  const totals = useMemo(() => {
    const sumFeed = lotesMetrics.reduce((acc, l) => acc + l.feedConsumed, 0)
    const sumCost = lotesMetrics.reduce((acc, l) => acc + l.feedCost, 0)
    const sumGain = lotesMetrics.reduce((acc, l) => acc + l.totalGain, 0)
    const totalAnimais = lotesMetrics.reduce((acc, l) => acc + l.animaisCount, 0)
    const avgFcr = sumGain > 0 ? sumFeed / sumGain : 0
    const activeGmdLots = lotesMetrics.filter((l) => l.avgGmd > 0)
    const avgGmd =
      activeGmdLots.length > 0
        ? activeGmdLots.reduce((acc, l) => acc + l.avgGmd, 0) / activeGmdLots.length
        : 0
    const costPerArroba = sumGain > 0 ? sumCost / (sumGain / 30) : 0

    return { sumFeed, sumCost, sumGain, totalAnimais, avgFcr, avgGmd, costPerArroba }
  }, [lotesMetrics])

  const allAnimalMetrics = useMemo(() => {
    return lotesMetrics.flatMap((l) =>
      l.animalMetrics.map((a) => ({ ...a, lote_nome: l.nome_lote })),
    )
  }, [lotesMetrics])

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      await createAuditoria({
        usuario_id: user?.id || '',
        tipo_acao: 'READ',
        tabela_afetada: 'relatorio_consumo_desempenho',
        registro_id: 'export',
        description: `Exportação de Consumo vs Desempenho. Formato: ${format}. Filtros: Lote ${loteId}, Data ${dateFrom} até ${dateTo}`,
      })
    } catch (e) {
      console.error('Audit log failed', e)
    }

    const exportData = lotesMetrics.map((l) => ({
      lote: l.nome_lote,
      animais: l.animaisCount,
      consumoTotalKg: formatNumber(l.feedConsumed),
      consumoCabecaKg: formatNumber(l.avgConsumptionPerHead),
      ganhoTotalKg: formatNumber(l.totalGain),
      gmd: formatNumber(l.avgGmd, 3),
      fcr: formatNumber(l.fcr),
      custoArroba: formatCurrency(l.costPerArroba),
    }))

    const columns = [
      { header: 'Lote', dataKey: 'lote' },
      { header: 'Animais', dataKey: 'animais' },
      { header: 'Consumo Total (kg)', dataKey: 'consumoTotalKg' },
      { header: 'Consumo/Cab (kg)', dataKey: 'consumoCabecaKg' },
      { header: 'Ganho Total (kg)', dataKey: 'ganhoTotalKg' },
      { header: 'GMD (kg/dia)', dataKey: 'gmd' },
      { header: 'CA (FCR)', dataKey: 'fcr' },
      { header: 'Custo/@', dataKey: 'custoArroba' },
    ]

    if (format === 'pdf') {
      exportToPDF({
        title: 'Relatório de Consumo vs Desempenho',
        data: exportData,
        columns,
        userName: user?.name || '',
      })
    } else {
      exportToExcel({
        title: 'Relatório de Consumo vs Desempenho',
        data: exportData,
        columns,
        userName: user?.name || '',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-black pt-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Filtros Avançados</CardTitle>
            <CardDescription>Segmentação para Análise de Eficiência</CardDescription>
          </div>
          <ExportButtons
            onExportPDF={() => handleExport('pdf')}
            onExportExcel={() => handleExport('excel')}
          />
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Data Inicial</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Data Final</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Lote</label>
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Lotes</SelectItem>
                {data.lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Categoria</label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {Array.from(new Set(data.animais.map((a) => a.categoria).filter(Boolean))).map(
                  (c: any) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Pasto/Piquete</label>
            <Select value={pastoId} onValueChange={setPastoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {data.pastos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Dieta (Fórmula)</label>
            <Select value={formulacaoId} onValueChange={setFormulacaoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {data.formulacoes.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_formulacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <Beef className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Animais Avaliados</p>
                <p className="text-2xl font-bold">{totals.totalAnimais}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Consumo Total</p>
                <p className="text-2xl font-bold">{formatNumber(totals.sumFeed)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Conversão Média (CA)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{formatNumber(totals.avgFcr)}</p>
                  {totals.avgFcr > 8 && (
                    <AlertCircle
                      className="w-4 h-4 text-red-500"
                      title="Alta Conversão (Ineficiente)"
                    />
                  )}
                  {totals.avgFcr > 0 && totals.avgFcr < 6 && (
                    <TrendingUp className="w-4 h-4 text-emerald-500" title="Ótima Conversão" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Custo / @ Produzida</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.costPerArroba)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 text-lg">
              Correlação: Conv. Alimentar vs GMD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                fcr: { label: 'Conv. Alimentar', color: '#f59e0b' },
                avgGmd: { label: 'GMD (kg)', color: '#10b981' },
              }}
              className="h-[300px] w-full"
            >
              <ComposedChart data={lotesMetrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="nome_lote"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#f59e0b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="fcr"
                  fill="var(--color-fcr)"
                  radius={[4, 4, 0, 0]}
                  name="Conv. Alimentar"
                  maxBarSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgGmd"
                  stroke="var(--color-avgGmd)"
                  strokeWidth={3}
                  name="GMD (kg)"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 text-lg">
              Custo da Arroba Produzida por Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ cost: { label: 'Custo @', color: '#ef4444' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={lotesMetrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="nome_lote"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="costPerArroba"
                  fill="var(--color-cost)"
                  radius={[4, 4, 0, 0]}
                  name="Custo @ (R$)"
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
            <div className="border-b px-6 py-2">
              <TabsList className="bg-transparent space-x-4">
                <TabsTrigger
                  value="lotes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Visão por Lotes
                </TabsTrigger>
                <TabsTrigger
                  value="animais"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Análise Individual
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="lotes" className="p-6 m-0 outline-none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Lote</th>
                      <th className="px-4 py-3">Animais</th>
                      <th className="px-4 py-3">Consumo Total (kg)</th>
                      <th className="px-4 py-3">Consumo/Cab (kg)</th>
                      <th className="px-4 py-3">Ganho Total (kg)</th>
                      <th className="px-4 py-3">GMD (kg/dia)</th>
                      <th className="px-4 py-3">Conversão (CA)</th>
                      <th className="px-4 py-3">Custo/@ Prod.</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotesMetrics.length > 0 ? (
                      lotesMetrics.map((l) => (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-emerald-900">{l.nome_lote}</td>
                          <td className="px-4 py-3">{l.animaisCount}</td>
                          <td className="px-4 py-3">{formatNumber(l.feedConsumed)}</td>
                          <td className="px-4 py-3">
                            {formatNumber(l.avgConsumptionPerHead)}
                            <span className="block text-[10px] text-slate-400">
                              Consumo estimado (baseado no lote)
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatNumber(l.totalGain)}</td>
                          <td className="px-4 py-3 font-semibold">{formatNumber(l.avgGmd, 3)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${l.fcr > 8 ? 'bg-red-100 text-red-700' : l.fcr > 0 && l.fcr < 6 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                            >
                              {formatNumber(l.fcr)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(l.costPerArroba)}
                            {l.missingCosts && (
                              <AlertTriangle
                                className="w-3 h-3 text-amber-500 inline ml-1"
                                title="Custo parcial: dados de insumos ausentes"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {l.totalGain === 0 && (
                              <span className="text-xs text-amber-600">
                                Aguardando pesagem para cálculo de GMD
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          Nenhum dado encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="animais" className="p-6 m-0 outline-none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Brinco</th>
                      <th className="px-4 py-3">Lote Atual</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Peso Inicial (kg)</th>
                      <th className="px-4 py-3">Peso Final (kg)</th>
                      <th className="px-4 py-3">Ganho Acumulado (kg)</th>
                      <th className="px-4 py-3">GMD (kg/dia)</th>
                      <th className="px-4 py-3">Pesagens no Período</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAnimalMetrics.length > 0 ? (
                      allAnimalMetrics.map((a) => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-emerald-900">{a.brinco}</td>
                          <td className="px-4 py-3">{a.lote_nome}</td>
                          <td className="px-4 py-3">{a.categoria}</td>
                          <td className="px-4 py-3">{formatNumber(a.firstWeight)}</td>
                          <td className="px-4 py-3">{formatNumber(a.lastWeight)}</td>
                          <td className="px-4 py-3 font-medium text-emerald-700">
                            +{formatNumber(a.gain)}
                          </td>
                          <td className="px-4 py-3 font-bold">{formatNumber(a.gmd, 3)}</td>
                          <td className="px-4 py-3">
                            {a.pesagensCount}
                            {a.pesagensCount < 2 && (
                              <span className="block text-[10px] text-amber-600">
                                Aguardando pesagem para cálculo de GMD
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          Nenhum animal encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
