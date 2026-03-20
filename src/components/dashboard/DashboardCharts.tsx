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
} from 'recharts'
import useAppStore from '@/stores/useAppStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardCharts() {
  const { state } = useAppStore()

  // Financeiro Data
  const financeData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    return months.map((m) => ({
      name: m,
      Receitas: Math.random() * 50000 + 30000,
      Despesas: Math.random() * 40000 + 20000,
    }))
  }, [])

  const abcData = useMemo(() => {
    return [
      { name: 'Nutrição (40-50%)', value: 45000, fill: 'hsl(var(--chart-1))' },
      { name: 'Mão de Obra', value: 20000, fill: 'hsl(var(--chart-3))' },
      { name: 'Sanidade/Medicamentos', value: 15000, fill: 'hsl(var(--chart-4))' },
      { name: 'Manutenção', value: 10000, fill: 'hsl(var(--chart-5))' },
      { name: 'Administrativo', value: 5000, fill: 'hsl(var(--chart-2))' },
    ]
  }, [])

  // Produção Data
  const reproData = useMemo(() => {
    const prenhes = state.reproducoes.filter(
      (r) => r.status === 'Prenhe' || r.status === 'Parida',
    ).length
    const vazias = state.reproducoes.filter((r) => r.status === 'Vazia').length
    return [
      { name: 'Prenhez (Sucesso)', value: prenhes || 1, fill: 'hsl(var(--chart-1))' },
      { name: 'Vazia (Falha)', value: vazias || 1, fill: 'hsl(var(--chart-5))' },
    ]
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

  const daysRemainingData = useMemo(() => {
    return state.estoque.slice(0, 5).map((e) => ({
      name: e.name.substring(0, 15),
      dias: Math.floor(e.quantity / (Math.random() * 10 + 1)),
    }))
  }, [state.estoque])

  return (
    <Tabs defaultValue="financeiro" className="mt-4 w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="financeiro">Dash Financeiro</TabsTrigger>
        <TabsTrigger value="producao">Dash Produção</TabsTrigger>
      </TabsList>

      <TabsContent value="financeiro" className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="shadow-subtle col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Receitas e Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Receitas: { color: 'hsl(var(--chart-1))' },
                Despesas: { color: 'hsl(var(--chart-5))' },
              }}
              className="h-[300px] w-full"
            >
              <ComposedChart data={financeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

      <TabsContent value="producao" className="grid gap-4 md:grid-cols-3 mt-4">
        <Card className="shadow-subtle col-span-1">
          <CardHeader>
            <CardTitle>Taxa de Concepção IATF</CardTitle>
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
            <CardTitle>Inventário por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={inventoryCategoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {inventoryCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-subtle col-span-1">
          <CardHeader>
            <CardTitle>Dias Restantes de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ dias: { color: 'hsl(var(--chart-1))' } }}
              className="h-[250px] w-full"
            >
              <BarChart
                data={daysRemainingData}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="dias" fill="var(--color-dias)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
