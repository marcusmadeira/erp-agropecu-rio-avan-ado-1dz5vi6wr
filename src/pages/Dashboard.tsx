import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { getTransacoesFinanceiras, TransacaoFinanceira } from '@/services/transacoes_financeiras'
import { useRealtime } from '@/hooks/use-realtime'
import { format, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const lineChartConfig = {
  Receitas: {
    label: 'Receitas',
    color: '#10b981',
  },
  Despesas: {
    label: 'Despesas',
    color: '#ef4444',
  },
}

const pieChartConfig = {
  fixa: {
    label: 'Custo Fixo',
    color: '#0f172a',
  },
  variavel: {
    label: 'Custo Variável',
    color: '#3b82f6',
  },
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<TransacaoFinanceira[]>([])

  const loadData = async () => {
    try {
      const data = await getTransacoesFinanceiras()
      setTransactions(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('transacoes_financeiras', () => {
    loadData()
  })

  const { receitaMes, despesaMes, saldoLiquido, chartData, pieData, recentTransactions } =
    useMemo(() => {
      const today = new Date()
      let recMes = 0
      let despMes = 0

      let fixa = 0
      let variavel = 0

      const last12Months = Array.from({ length: 12 }).map((_, i) => {
        const d = subMonths(today, 11 - i)
        return {
          month: format(d, 'MMM/yy', { locale: ptBR }),
          monthKey: format(d, 'yyyy-MM'),
          Receitas: 0,
          Despesas: 0,
        }
      })

      transactions.forEach((t) => {
        const d = new Date(t.data_competencia)

        if (isSameMonth(d, today)) {
          if (t.tipo_movimento === 'Receita') recMes += t.valor_total
          if (t.tipo_movimento === 'Despesa') despMes += t.valor_total
        }

        if (t.tipo_movimento === 'Despesa') {
          if (t.classificacao_custo === 'FIXA') fixa += t.valor_total
          if (t.classificacao_custo === 'VARIÁVEL') variavel += t.valor_total
        }

        const key = format(d, 'yyyy-MM')
        const monthData = last12Months.find((m) => m.monthKey === key)
        if (monthData) {
          if (t.tipo_movimento === 'Receita') monthData.Receitas += t.valor_total
          if (t.tipo_movimento === 'Despesa') monthData.Despesas += t.valor_total
        }
      })

      const pie = [
        { name: 'Custo Fixo', value: fixa, fill: 'var(--color-fixa)' },
        { name: 'Custo Variável', value: variavel, fill: 'var(--color-variavel)' },
      ].filter((d) => d.value > 0)

      const recent = [...transactions]
        .sort(
          (a, b) => new Date(b.data_competencia).getTime() - new Date(a.data_competencia).getTime(),
        )
        .slice(0, 10)

      return {
        receitaMes: recMes,
        despesaMes: despMes,
        saldoLiquido: recMes - despMes,
        chartData: last12Months,
        pieData: pie,
        recentTransactions: recent,
      }
    }, [transactions])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Financeiro</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Receita Total do Mês
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(receitaMes)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Despesa Total do Mês
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(despesaMes)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Saldo Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(saldoLiquido)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Evolução de Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
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
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="Receitas"
                  stroke="var(--color-Receitas)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Despesas"
                  stroke="var(--color-Despesas)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center relative">
              <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <ChartLegend
                    content={<ChartLegendContent />}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ChartContainer>
              {pieData.length === 0 && (
                <div className="absolute text-slate-500 text-sm inset-0 flex items-center justify-center pointer-events-none">
                  Sem dados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Data</TableHead>
                <TableHead className="text-slate-600">Descrição</TableHead>
                <TableHead className="text-slate-600">Parceiro</TableHead>
                <TableHead className="text-slate-600">Tipo</TableHead>
                <TableHead className="text-right text-slate-600">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((t) => (
                <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    {format(new Date(t.data_competencia), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-slate-700">{t.descricao_lancamento}</TableCell>
                  <TableCell className="text-slate-700">
                    {t.expand?.parceiro_id?.nome_razao_social || 'Desconhecido'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo_movimento === 'Receita'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.tipo_movimento}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${
                      t.tipo_movimento === 'Receita' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.tipo_movimento === 'Receita' ? '+' : '-'}
                    {formatCurrency(t.valor_total)}
                  </TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhuma transação recente encontrada.
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
