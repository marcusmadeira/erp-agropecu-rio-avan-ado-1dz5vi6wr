import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, parseISO } from 'date-fns'
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { BillingAlertsWidget } from '@/components/cobrancas/BillingAlertsWidget'

const formatCurrency = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const getStartOfHalfYear = (date: Date) => {
  return startOfMonth(new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1))
}

const getEndOfHalfYear = (date: Date) => {
  return endOfMonth(new Date(date.getFullYear(), date.getMonth() < 6 ? 5 : 11, 1))
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const [loading, setLoading] = useState(true)
  const [resumoData, setResumoData] = useState<any>(null)
  const [inadimplenciaData, setInadimplenciaData] = useState<any>(null)
  const [calendarioData, setCalendarioData] = useState<any[]>([])
  const [kpiData, setKpiData] = useState<any>(null)
  const [chartFilter, setChartFilter] = useState<'ALL' | 'FIXA' | 'VARIÁVEL'>('ALL')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const dStart = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
        const dEnd = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''

        let qs = ''
        if (dStart && dEnd) {
          qs = `?data_inicio=${dStart}&data_fim=${dEnd}`
        } else if (dStart) {
          qs = `?data_inicio=${dStart}`
        }

        const [rFinanceiro, rInadimplencia, rCalendario, rKpis] = await Promise.all([
          pb.send(`/backend/v1/obter_resumo_financeiro${qs}`, { method: 'GET' }),
          pb.send(`/backend/v1/obter_inadimplencia${qs}`, { method: 'GET' }),
          pb.send(`/backend/v1/obter_despesas_calendario${qs}`, { method: 'GET' }),
          pb.send(`/backend/v1/obter_kpis_saude${qs}`, { method: 'GET' }),
        ])

        setResumoData(rFinanceiro)
        setInadimplenciaData(rInadimplencia)
        setCalendarioData(rCalendario)
        setKpiData(rKpis)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dateRange])

  // Summary KPIs
  const receitas = Number(resumoData?.receitas) || 0
  const despesas = Number(resumoData?.despesas) || 0
  const saldo = Number(resumoData?.saldo) || 0
  const margem = Number(resumoData?.margem) || 0

  // Delinquency Panel
  const valorEmAberto = Number(inadimplenciaData?.valorEmAberto) || 0
  const previsao30Dias = Number(inadimplenciaData?.previsao30Dias) || 0

  const pieData = (inadimplenciaData?.pieData || [])
    .filter((item: any) => item.value > 0)
    .map((item: any) => ({
      ...item,
      color: item.name === 'Pago' ? '#094016' : item.name === 'Atrasado' ? '#dc2626' : '#eab308',
    }))

  const tableData = inadimplenciaData?.tableData || []

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
  }

  // Health Metrics
  const custoArroba = kpiData?.custoArroba || 0
  const lotacao = kpiData?.lotacao || 0
  const taxaPrenhez = kpiData?.taxaPrenhez || 0
  const desembolsoCabeca = kpiData?.desembolsoCabeca || 0
  const totalAnimais = kpiData?.totalAnimais || 0
  const roi = kpiData?.roi || 0

  // Chart Data
  const chartData = useMemo(() => {
    if (!resumoData?.transacoes) return []
    const map: Record<string, { name: string; Receitas: number; Despesas: number }> = {}
    resumoData.transacoes.forEach((t: any) => {
      const d = t.data_vencimento ? parseISO(t.data_vencimento) : new Date()
      const sortKey = format(d, 'yyyy-MM')
      const displayKey = format(d, 'MMM/yy')
      if (!map[sortKey]) map[sortKey] = { name: displayKey, Receitas: 0, Despesas: 0 }
      if (t.tipo_movimento === 'Receita') {
        map[sortKey].Receitas += t.valor_total
      } else if (t.tipo_movimento === 'Despesa') {
        if (chartFilter === 'ALL' || t.classificacao_custo === chartFilter) {
          map[sortKey].Despesas += t.valor_total
        }
      }
    })
    return Object.keys(map)
      .sort()
      .map((k) => map[k])
  }, [resumoData, chartFilter])

  // Calendar Data
  const monthStart = dateRange?.from ? startOfMonth(dateRange.from) : startOfMonth(new Date())
  const monthEnd = dateRange?.from ? endOfMonth(dateRange.from) : endOfMonth(new Date())

  const calendarDays = useMemo(() => {
    const days = []
    const startDay = monthStart.getDay()
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const evs = calendarioData.filter(
        (t: any) => t.data_despesa && t.data_despesa.startsWith(dateStr),
      )
      days.push({
        date: i,
        events: evs,
        isToday: dateStr === format(new Date(), 'yyyy-MM-dd'),
      })
    }
    return days
  }, [monthStart, monthEnd, calendarioData])

  const totalPeriodoCalendario = calendarDays.reduce((acc, d) => {
    if (!d) return acc
    return acc + d.events.reduce((sum: number, ev: any) => sum + ev.valor, 0)
  }, 0)

  // Filters
  const setCattleYear = () => {
    const now = new Date()
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
    setDateRange({ from: new Date(year, 6, 1), to: new Date(year + 1, 5, 30) })
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#094016]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#094016]">Dashboard Financeiro</h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento econômico e saúde da fazenda
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
            }
          >
            Mês
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) })
            }
          >
            Trimestre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDateRange({
                from: getStartOfHalfYear(new Date()),
                to: getEndOfHalfYear(new Date()),
              })
            }
          >
            Semestre
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={setCattleYear}
            className="bg-[#094016] text-white hover:bg-[#094016]/90"
          >
            Ano Pecuário
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <BillingAlertsWidget />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-[#16a34a]">
          <CardHeader className="pb-2 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#16a34a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">{formatCurrency(receitas)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#dc2626]">
          <CardHeader className="pb-2 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Despesa Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-[#dc2626]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#dc2626]">{formatCurrency(despesas)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#094016]">
          <CardHeader className="pb-2 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-[#094016]" />
          </CardHeader>
          <CardContent>
            <div
              className={cn('text-2xl font-bold', saldo >= 0 ? 'text-[#094016]' : 'text-[#dc2626]')}
            >
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardHeader className="pb-2 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{margem.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold text-[#094016] mt-8 mb-2">
        Métricas Agro-Financeiras (Saúde)
      </h3>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Custo @ (@)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">
              {formatCurrency(custoArroba)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Custo variável / arrobas ativas
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Lotação (cab/ha)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">{lotacao.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Animais por hectare total</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Taxa Prenhez (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">
              {taxaPrenhez.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Prenhas / IATF Realizados</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Desembolso/Cab
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">
              {formatCurrency(desembolsoCabeca)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Despesas do período / Ativos</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Animais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">{totalAnimais}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Status diferente de vendido/morto
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-[#094016]">
              {(roi * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Retorno sobre Investimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7 mt-6">
        <Card className="shadow-sm col-span-1 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Oscilação Financeira</CardTitle>
              <CardDescription>Receitas vs Despesas no período</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Despesa:</Label>
              <select
                className="text-xs border rounded p-1 bg-white outline-none"
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value as any)}
              >
                <option value="ALL">Todas</option>
                <option value="FIXA">Apenas Fixas</option>
                <option value="VARIÁVEL">Apenas Variáveis</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(val) => `R$${val / 1000}k`}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#094016" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm col-span-1 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Painel de Inadimplência</CardTitle>
            <CardDescription>Posição atual de pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs text-red-600 font-semibold mb-1">Valor em Aberto</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(valorEmAberto)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 font-semibold mb-1">Previsão 30 Dias</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(previsao30Dias)}</p>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => v} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg">Clientes em Atraso (CRM)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Atraso</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhuma parcela em atraso
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell
                        className="font-semibold text-xs truncate max-w-[120px]"
                        title={row.clienteNome}
                      >
                        {row.clienteNome}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.vencimento ? format(parseISO(row.vencimento), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-bold text-xs">
                        {row.diasAtraso}d
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {formatCurrency(row.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#094016] border-[#094016] hover:bg-[#094016]/10 h-7 text-xs px-2"
                          onClick={() => handleWhatsApp(row.clientePhone)}
                          disabled={!row.clientePhone}
                        >
                          <Phone className="w-3 h-3 mr-1" /> Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Calendário de Despesas (Mês Base)</CardTitle>
            <CardDescription>Visualização do mês selecionado ou atual</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[350px]">
            <div className="grid grid-cols-7 gap-1 min-w-[500px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold py-2 text-slate-500">
                  {d}
                </div>
              ))}
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'min-h-24 p-1 border rounded bg-white',
                    d?.isToday ? 'border-[#094016] bg-[#094016]/5' : 'border-slate-100',
                  )}
                >
                  {d && (
                    <>
                      <div
                        className={cn(
                          'text-xs font-bold mb-1',
                          d.isToday ? 'text-[#094016]' : 'text-slate-400',
                        )}
                      >
                        {d.date}
                      </div>
                      <div className="space-y-1">
                        {d.events.map((ev: any) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'text-[9px] leading-tight p-1 rounded truncate cursor-help border',
                              ev.classificacao_custo === 'VARIÁVEL'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200',
                            )}
                            title={`${ev.descricao || ev.tipo_despesa} - ${formatCurrency(ev.valor)}`}
                          >
                            {formatCurrency(ev.valor)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 border-t bg-slate-50 flex justify-between items-center rounded-b-xl">
            <span className="text-sm font-semibold text-slate-600">Total do Mês Exibido:</span>
            <span className="font-bold text-[#094016]">
              {formatCurrency(totalPeriodoCalendario)}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
