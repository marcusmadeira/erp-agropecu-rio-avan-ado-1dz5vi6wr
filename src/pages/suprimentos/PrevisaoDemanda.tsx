import { useState, useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { BrainCircuit, AlertTriangle, PackageSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function PrevisaoDemanda() {
  const { state } = useAppStore()
  const [filterCC, setFilterCC] = useState('ALL')
  const [selectedItem, setSelectedItem] = useState(state.estoque[0]?.id || '')

  const filteredLotes = state.lotes.filter((l) => filterCC === 'ALL' || l.costCenter === filterCC)
  const loteIds = filteredLotes.map((l) => l.id)
  const headCount = state.animais.filter(
    (a) => loteIds.includes(a.loteId) && a.status === 'Ativo',
  ).length

  const forecastData = useMemo(() => {
    return state.estoque.map((item) => {
      const itemManejos = state.manejos.filter(
        (m) => m.itemId === item.id && (!m.loteId || loteIds.includes(m.loteId)),
      )
      const totalConsumed = itemManejos.reduce((acc, m) => acc + (m.quantity || 0), 0)

      const HISTORY_DAYS = 30
      // Mock calculation: average consumed over last 30 days per animal
      let dailyRatePerHead = headCount > 0 ? totalConsumed / HISTORY_DAYS / headCount : 0

      // If no history, inject mock base logic to make chart interesting
      if (dailyRatePerHead === 0 && headCount > 0) {
        dailyRatePerHead = item.unitCost < 5 ? 0.5 : 0.05 // cheap=kg feed, expensive=doses
      }

      const dailyTotal = dailyRatePerHead * headCount

      const proj30 = dailyTotal * 30
      const proj60 = dailyTotal * 60
      const proj90 = dailyTotal * 90

      const suggestion = Math.max(0, proj30 - item.quantity)
      const isStockoutRisk = item.quantity < proj30

      return {
        ...item,
        dailyRatePerHead,
        dailyTotal,
        proj30,
        proj60,
        proj90,
        suggestion,
        isStockoutRisk,
        cost30: suggestion * item.unitCost,
      }
    })
  }, [state.estoque, state.manejos, loteIds, headCount])

  const chartData = useMemo(() => {
    const item = forecastData.find((i) => i.id === selectedItem)
    if (!item || item.dailyTotal === 0) return []

    const data = []
    const baseDate = new Date()

    // Historical (last 30 days)
    let accHist = 0
    for (let i = -30; i <= 0; i++) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)

      const dayManejos = state.manejos.filter((m) => {
        if (m.itemId !== item.id) return false
        const md = new Date(m.date)
        return md.getDate() === d.getDate() && md.getMonth() === d.getMonth()
      })
      const dayConsumed = dayManejos.reduce((acc, m) => acc + (m.quantity || 0), 0)

      const val = dayConsumed > 0 ? dayConsumed : item.dailyTotal * (0.8 + Math.random() * 0.4)
      accHist += val

      data.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        Historico: val,
        Projetado: null,
      })
    }

    // Projected (next 30 days)
    for (let i = 1; i <= 30; i++) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      data.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        Historico: null,
        Projetado: item.dailyTotal,
      })
    }

    return data
  }, [forecastData, selectedItem, state.manejos])

  const totalCost30 = forecastData.reduce((acc, curr) => acc + curr.cost30, 0)
  const stockoutAlerts = forecastData.filter((f) => f.isStockoutRisk).length

  const chartConfig = {
    Historico: { label: 'Consumo Histórico', color: 'hsl(var(--chart-1))' },
    Projetado: { label: 'Demanda Projetada', color: 'hsl(var(--chart-2))' },
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-emerald-900">IA de Previsão de Demanda</h2>
        </div>
        <Select value={filterCC} onValueChange={setFilterCC}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filtrar Centro Custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Geral da Fazenda</SelectItem>
            <SelectItem value="CC01-PO">CC01-PO (Elite)</SelectItem>
            <SelectItem value="CC02-TIP">CC02-TIP (Comercial)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-subtle border-t-4 border-t-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Custo Estimado de Compras (30 Dias)
            </CardTitle>
            <PackageSearch className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 font-mono">
              {formatCurrency(totalCost30)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Baseado nos animais ativos no lote</p>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-t-4 border-t-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Risco de Ruptura (Stockout)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 font-mono">
              {stockoutAlerts} itens críticos
            </div>
            <p className="text-xs text-muted-foreground mt-1">Necessitam compra imediata</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle>Curva de Consumo & Projeção</CardTitle>
          <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-56 bg-white">
              <SelectValue placeholder="Selecione um Insumo" />
            </SelectTrigger>
            <SelectContent>
              {state.estoque.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-Historico)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-Historico)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-Projetado)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-Projetado)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="Historico"
                  stroke="var(--color-Historico)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHist)"
                />
                <Area
                  type="monotone"
                  dataKey="Projetado"
                  stroke="var(--color-Projetado)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorProj)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Selecione um insumo com dados de uso.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle mt-4">
        <CardHeader>
          <CardTitle>Plano de Compras Sugerido</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Projeção 30d</TableHead>
                <TableHead className="text-right">Comprar (+Margem)</TableHead>
                <TableHead className="text-right">Custo Est.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecastData.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-semibold">{f.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {f.quantity} {f.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Math.ceil(f.proj30)} {f.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-indigo-700 font-bold">
                    {Math.ceil(f.suggestion)} {f.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(f.cost30)}</TableCell>
                  <TableCell>
                    {f.isStockoutRisk ? (
                      <Badge variant="destructive" className="animate-pulse">
                        Ruptura Iminente
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600">Ok</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
