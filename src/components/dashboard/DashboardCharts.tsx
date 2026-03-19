import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import useAppStore from '@/stores/useAppStore'

export default function DashboardCharts() {
  const { state } = useAppStore()

  const cashFlowData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    return months.map((m) => ({
      name: m,
      Realizado: Math.random() * 50000 + 20000,
      Projetado: Math.random() * 60000 + 25000,
    }))
  }, [])

  const reproData = useMemo(() => {
    const prenhes = state.reproducoes.filter(
      (r) => r.status === 'Prenhe' || r.status === 'Parida',
    ).length
    const vazias = state.reproducoes.filter((r) => r.status === 'Vazia').length
    const aguardando = state.reproducoes.filter((r) => r.status === 'Aguardando Toque').length
    return [
      { name: 'Prenhes', value: prenhes, fill: 'hsl(var(--chart-2))' },
      { name: 'Vazias', value: vazias, fill: 'hsl(var(--chart-5))' },
      { name: 'Aguardando', value: aguardando, fill: 'hsl(var(--chart-4))' },
    ]
  }, [state.reproducoes])

  const lotesCostData = useMemo(() => {
    return state.lotes.map((lote) => {
      const loteManejos = state.manejos.filter((m) => m.loteId === lote.id)
      const custoVariavel = loteManejos.reduce((acc, m) => acc + (m.cost || 0), 0)

      const animais = state.animais.filter((a) => a.loteId === lote.id && a.status === 'Ativo')
      const totalGain = animais.reduce(
        (acc, a) => acc + (a.pesoAtual - (a.pesoEntrada || a.pesoAtual)),
        0,
      )

      const arrobasProduced = totalGain / 30
      const custoArroba = arrobasProduced > 0 ? custoVariavel / arrobasProduced : 0

      return {
        name: lote.name,
        custoArroba: Number(custoArroba.toFixed(2)),
      }
    })
  }, [state.lotes, state.manejos, state.animais])

  return (
    <div className="grid gap-4 md:grid-cols-3 mt-4">
      <Card className="shadow-subtle col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Fluxo de Caixa Projetado vs Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Realizado: { color: 'hsl(var(--chart-2))' },
              Projetado: { color: 'hsl(var(--chart-1))' },
            }}
            className="h-[300px] w-full"
          >
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="Projetado"
                stroke="var(--color-Projetado)"
                fill="var(--color-Projetado)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="Realizado"
                stroke="var(--color-Realizado)"
                fill="var(--color-Realizado)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-subtle col-span-1">
        <CardHeader>
          <CardTitle>Taxa de Prenhez Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={reproData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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

      <Card className="shadow-subtle col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>Custo por Arroba Produzida (R$/@) por Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ custoArroba: { color: 'hsl(var(--chart-1))' } }}
            className="h-[250px] w-full"
          >
            <BarChart data={lotesCostData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="custoArroba" fill="var(--color-custoArroba)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
