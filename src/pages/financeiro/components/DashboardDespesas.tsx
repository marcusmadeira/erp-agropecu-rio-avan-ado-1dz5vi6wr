import { useMemo, useState, useEffect } from 'react'
import { getBoletosPagar } from '@/services/boletos_pagar'
import { getDespesas } from '@/services/despesas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { differenceInDays } from 'date-fns'
import { ChartContainer } from '@/components/ui/chart'

const COLORS = ['#094016', '#2ecc71', '#1abc9c', '#f1c40f', '#e67e22', '#e74c3c']

export default function DashboardDespesas() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [boletos, setBoletos] = useState<any[]>([])

  const load = async () => {
    try {
      setDespesas(await getDespesas())
      setBoletos(await getBoletosPagar())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('despesas', load)
  useRealtime('boletos_pagar', load)

  const kpis = useMemo(() => {
    let totalToPay = 0
    let overdueCount = 0
    let delaySum = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    boletos.forEach((b) => {
      if (b.status !== 'Pago' && b.status !== 'Cancelado') {
        totalToPay += b.valor || 0
      }
      const venc = new Date(b.data_vencimento)
      if (b.status === 'Pendente' && venc < today) {
        overdueCount++
        delaySum += differenceInDays(today, venc)
      }
    })

    const avgDelay = overdueCount > 0 ? Math.round(delaySum / overdueCount) : 0
    const totalExp = despesas.reduce((acc, d) => acc + (d.valor || 0), 0)
    const ticketMedio = despesas.length > 0 ? totalExp / despesas.length : 0

    return { totalToPay, overdueCount, avgDelay, ticketMedio }
  }, [boletos, despesas])

  const charts = useMemo(() => {
    const suppMap: any = {}
    despesas.forEach((d) => {
      const name = d.expand?.fornecedor_id?.nome_razao_social || 'Desconhecido'
      suppMap[name] = (suppMap[name] || 0) + (d.valor || 0)
    })
    const topSuppliers = Object.entries(suppMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5)

    const catMap: any = {}
    despesas.forEach((d) => {
      const c = d.classificacao_custo || 'Outros'
      catMap[c] = (catMap[c] || 0) + (d.valor || 0)
    })
    const byCategory = Object.entries(catMap).map(([name, value]) => ({ name, value }))

    return { topSuppliers, byCategory }
  }, [despesas])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                kpis.totalToPay,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Boletos Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Média de Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgDelay} dias</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                kpis.ticketMedio,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Fornecedores</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ value: { color: '#094016' } }}>
              <BarChart data={charts.topSuppliers} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
                  }
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer config={{ value: { color: '#094016' } }}>
              <PieChart>
                <Pie
                  data={charts.byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {charts.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
                  }
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
