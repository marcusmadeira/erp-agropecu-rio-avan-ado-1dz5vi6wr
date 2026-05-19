import { useMemo, useState, useEffect } from 'react'
import { getBoletosPagar } from '@/services/boletos_pagar'
import { getDespesas } from '@/services/despesas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { differenceInDays } from 'date-fns'
import { ChartContainer } from '@/components/ui/chart'
import pb from '@/lib/pocketbase/client'
import { ArrowDownIcon, ArrowUpIcon, AlertTriangleIcon, WalletIcon } from 'lucide-react'

const COLORS = ['#094016', '#2ecc71', '#1abc9c', '#f1c40f', '#e67e22', '#e74c3c']

export default function DashboardDespesas() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [boletos, setBoletos] = useState<any[]>([])
  const [receitasRealizadas, setReceitasRealizadas] = useState<number>(0)

  const load = async () => {
    if (!pb.authStore.isValid) return
    try {
      setDespesas(await getDespesas())
      setBoletos(await getBoletosPagar())

      const resumoData = await pb.send('/backend/v1/obter_resumo_financeiro', { method: 'GET' })
      setReceitasRealizadas(Number(resumoData.receitasRealizadas) || 0)
    } catch (e: any) {
      console.error(e)
      if (e?.status === 401) {
        pb.authStore.clear()
        window.location.href = '/login'
      }
    }
  }

  useEffect(() => {
    if (pb.authStore.isValid) {
      load()
    }
  }, [])

  useRealtime('despesas', load)
  useRealtime('boletos_pagar', load)
  useRealtime('parcelas_venda', load)
  useRealtime('transacoes_financeiras', load)

  const kpis = useMemo(() => {
    let despesasPagas = 0
    let despesasAPagar = 0
    let overdueCount = 0
    let delaySum = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    boletos.forEach((b) => {
      const val = Number(b.valor) || 0
      if (b.status === 'Pago') {
        despesasPagas += val
      } else if (b.status === 'Pendente' || b.status === 'Atrasado') {
        despesasAPagar += val
      }

      if (
        b.status === 'Atrasado' ||
        (b.status === 'Pendente' && new Date(b.data_vencimento) < today)
      ) {
        overdueCount++
        delaySum += differenceInDays(today, new Date(b.data_vencimento))
      }
    })

    const saldo = receitasRealizadas - despesasPagas

    return {
      receitasRealizadas,
      despesasPagas,
      despesasAPagar,
      saldo,
      overdueCount,
      delaySum,
    }
  }, [boletos, despesas, receitasRealizadas])

  const charts = useMemo(() => {
    const suppMap: any = {}
    despesas.forEach((d) => {
      const name = d.expand?.fornecedor_id?.nome_razao_social || 'Desconhecido'
      suppMap[name] = (suppMap[name] || 0) + (Number(d.valor) || 0)
    })
    const topSuppliers = Object.entries(suppMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5)

    const catMap: any = {}
    despesas.forEach((d) => {
      const c = d.classificacao_custo || 'Outros'
      catMap[c] = (catMap[c] || 0) + (Number(d.valor) || 0)
    })
    const byCategory = Object.entries(catMap).map(([name, value]) => ({ name, value }))

    return { topSuppliers, byCategory }
  }, [despesas])

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Receitas (Realizadas)</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(kpis.receitasRealizadas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(kpis.despesasPagas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Despesas a Pagar</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(kpis.despesasAPagar)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Saldo Realizado</CardTitle>
            <WalletIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${kpis.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}
            >
              {formatCurrency(kpis.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.overdueCount} boletos</div>
            <p className="text-xs text-muted-foreground mt-1">Atrasados</p>
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
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
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
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
