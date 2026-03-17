import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const chartConfig = {
    receita: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
    despesa: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
  }

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
    const txs = state.transacoes.filter((t) => new Date(t.date).getMonth() === m)
    return {
      name: months[m],
      receita: txs.filter((t) => t.type === 'Receita').reduce((a, b) => a + b.value, 0),
      despesa: txs.filter((t) => t.type === 'Despesa').reduce((a, b) => a + b.value, 0),
    }
  })

  const totalMatrizes = state.animais.filter((a) => a.categoria === 'Matriz').length
  const prenhes = state.reproducoes.filter((r) => r.status === 'Prenhe').length
  const vazias = totalMatrizes - prenhes

  const pieData = [
    { name: 'Prenhes', value: prenhes, color: 'hsl(var(--chart-1))' },
    { name: 'Vazias/Aguardando', value: vazias, color: 'hsl(var(--chart-2))' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle className="text-emerald-900">Fluxo de Caixa Projetado</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
          <CardTitle className="text-emerald-900">Taxa de Prenhez (Zootécnico)</CardTitle>
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
    </div>
  )
}
