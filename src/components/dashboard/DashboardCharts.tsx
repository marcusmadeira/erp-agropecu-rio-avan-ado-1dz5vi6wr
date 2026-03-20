import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts'
import useAppStore from '@/stores/useAppStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DashboardCharts() {
  const { state } = useAppStore()
  const [period, setPeriod] = useState('year')

  // Financeiro Data
  const financeData = useMemo(() => {
    let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    if (period === 'semester') months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    if (period === 'quarter') months = ['Abr', 'Mai', 'Jun']

    return months.map((m) => ({
      name: m,
      Receitas: Math.random() * 50000 + 30000,
      Despesas: Math.random() * 40000 + 20000,
    }))
  }, [period])

  const abcData = useMemo(() => {
    return [
      { name: 'Nutrição (40-50%)', value: 45000, fill: 'hsl(var(--chart-1))' },
      { name: 'Mão de Obra', value: 20000, fill: 'hsl(var(--chart-2))' },
      { name: 'Sanidade/Medicamentos', value: 15000, fill: 'hsl(var(--chart-3))' },
      { name: 'Manutenção', value: 10000, fill: 'hsl(var(--chart-4))' },
      { name: 'Administrativo', value: 5000, fill: 'hsl(var(--chart-5))' },
    ]
  }, [])

  // Produção Data
  const reproData = useMemo(() => {
    return [
      { name: '1ª IATF (Sucesso)', value: 55, fill: 'hsl(var(--chart-1))' },
      { name: '2ª IATF (Sucesso)', value: 30, fill: 'hsl(var(--chart-2))' },
      { name: 'Vazia (Falha)', value: 15, fill: 'hsl(var(--chart-5))' },
    ]
  }, [])

  const sireRanking = useMemo(() => {
    const map: Record<string, { total: number; prenhe: number }> = {}
    state.reproducoes.forEach((r) => {
      const t = r.touro || 'Desconhecido'
      if (!map[t]) map[t] = { total: 0, prenhe: 0 }
      map[t].total++
      if (r.status === 'Prenhe' || r.status === 'Parida') map[t].prenhe++
    })
    return Object.entries(map)
      .map(([name, data]) => ({
        name: name.substring(0, 15),
        taxa: data.total > 0 ? (data.prenhe / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 5)
  }, [state.reproducoes])

  const inventoryCategoryData = useMemo(() => {
    const categories: Record<string, number> = {}
    state.estoque.forEach((e) => {
      categories[e.category] = (categories[e.category] || 0) + e.quantity
    })
    return Object.entries(categories).map(([name, value], i) => ({
      name,
      value,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`,
    }))
  }, [state.estoque])

  const predictiveStockData = useMemo(() => {
    const coreNames = ['Milho', 'Mineral', 'Farelo', 'Ureia', 'Sal']
    return state.estoque
      .filter((e) => coreNames.some((cn) => e.name.toLowerCase().includes(cn.toLowerCase())))
      .map((e) => {
        // mock consumption rate
        const dailyCons = Math.random() * 50 + 10
        return {
          name: e.name.split(' ')[0],
          dias: Math.floor(e.quantity / dailyCons),
          limit: 15, // 15 days is critical
        }
      })
  }, [state.estoque])

  return (
    <div className="mt-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="financeiro" className="w-full max-w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="financeiro">Dash Financeiro</TabsTrigger>
            <TabsTrigger value="producao">Dash Produção</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year">Ano Atual</SelectItem>
            <SelectItem value="semester">Semestre</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Since TabsContent wraps multiple cards, we need to structure it carefully to let Tabs control visibility. We'll use CSS based on the TabsRoot state, or wrap them individually. Wait, shadcn Tabs requires TabsContent to be a direct child or correctly structured. */}

      {/* We can use standard mapping or wrap everything in a div that checks active tab. But standard shadcn TabsContent is fine here. */}
      <div className="relative">
        <TabsContent
          value="financeiro"
          className="grid gap-4 md:grid-cols-2 m-0 border-none p-0 outline-none"
        >
          <Card className="shadow-subtle col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Evolução de Receitas e Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Receitas: { color: 'hsl(var(--chart-1))', label: 'Receitas (R$)' },
                  Despesas: { color: 'hsl(var(--chart-5))', label: 'Despesas (R$)' },
                }}
                className="h-[300px] w-full"
              >
                <ComposedChart
                  data={financeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="Receitas" fill="var(--color-Receitas)" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Despesas"
                    stroke="var(--color-Despesas)"
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-subtle col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Curva ABC de Despesas (Ranking)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[250px] w-full">
                <BarChart
                  layout="vertical"
                  data={abcData}
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]}>
                    {abcData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="producao"
          className="grid gap-4 md:grid-cols-3 m-0 border-none p-0 outline-none"
        >
          <Card className="shadow-subtle col-span-1">
            <CardHeader>
              <CardTitle>Taxa de Concepção</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={reproData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label
                  >
                    {reproData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-subtle col-span-1">
            <CardHeader>
              <CardTitle>Top Touros (% Prenhez)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ taxa: { color: 'hsl(var(--chart-1))', label: '% Sucesso' } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  layout="vertical"
                  data={sireRanking}
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="taxa" fill="var(--color-taxa)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-subtle col-span-1">
            <CardHeader>
              <CardTitle>Estoque Crítico (Dias Restantes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ dias: { color: 'hsl(var(--chart-2))', label: 'Dias Restantes' } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={predictiveStockData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={15}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Crítico', fill: 'red', fontSize: 10 }}
                  />
                  <Bar dataKey="dias" fill="var(--color-dias)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </div>
  )
}
