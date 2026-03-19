import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import useAppStore from '@/stores/useAppStore'

export default function DashboardCharts() {
  const { state } = useAppStore()

  const currentMonth = new Date().getMonth()
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  const cashData = Array.from({ length: 4 }).map((_, i) => {
    const m = (currentMonth + i) % 12
    const txs = state.transacoes.filter((t) => {
      try {
        if (!t.Data_Vencimento) return false
        return new Date(t.Data_Vencimento).getMonth() === m
      } catch (e) {
        return false
      }
    })
    return {
      name: months[m],
      receita: txs
        .filter((t) => t.Tipo_Movimento === 'Receita')
        .reduce((a, b) => a + b.Valor_Total, 0),
      despesa: txs
        .filter((t) => t.Tipo_Movimento === 'Despesa')
        .reduce((a, b) => a + b.Valor_Total, 0),
    }
  })

  const totalMatrizes = state.animais.filter((a) => a.categoria === 'Matriz').length
  const prenhes = state.reproducoes.filter((r) => r.status === 'Prenhe').length
  const vazias = totalMatrizes - prenhes

  const pieData = [
    { name: 'Prenhes', value: prenhes, color: 'hsl(var(--chart-1))' },
    { name: 'Vazias/Aguardando', value: vazias, color: 'hsl(var(--chart-2))' },
  ]

  // Calculate Bull Ranking
  const bullRankingData = useMemo(() => {
    const stats: Record<string, { total: number; prenhes: number }> = {}
    state.reproducoes.forEach((r) => {
      if (!r.touro) return
      const tName = r.touro.replace('Sêmen Touro ', '').trim() // clean up string
      if (!stats[tName]) stats[tName] = { total: 0, prenhes: 0 }
      stats[tName].total++
      if (r.status === 'Prenhe' || r.status === 'Parida') stats[tName].prenhes++
    })
    return Object.entries(stats)
      .map(([touro, data]) => ({
        name: touro.length > 15 ? touro.substring(0, 15) + '...' : touro,
        taxa: Number(((data.prenhes / data.total) * 100).toFixed(1)),
        total: data.total,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 4) // Top 4 bulls
  }, [state.reproducoes])

  return (
    <div className="grid gap-4 md:grid-cols-3 mt-4">
      <Card className="shadow-subtle col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-emerald-900">Fluxo de Caixa Projetado</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              receita: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
              despesa: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
            }}
            className="h-[250px] w-full"
          >
            <BarChart data={cashData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="receita" fill="var(--color-receita)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="var(--color-despesa)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-emerald-900">Taxa de Prenhez Geral</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-emerald-900">Ranking Reprodutivo</CardTitle>
          <CardDescription>Top 4 Touros/Sêmen (% de Sucesso IATF)</CardDescription>
        </CardHeader>
        <CardContent>
          {bullRankingData.length > 0 ? (
            <ChartContainer
              config={{
                taxa: { label: 'Taxa Sucesso (%)', color: 'hsl(var(--chart-3))' },
              }}
              className="h-[230px] w-full"
            >
              <BarChart data={bullRankingData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="taxa"
                  fill="var(--color-taxa)"
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', formatter: (v: number) => `${v}%`, fontSize: 10 }}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[230px] flex items-center justify-center text-sm text-muted-foreground">
              Sem dados reprodutivos suficientes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
