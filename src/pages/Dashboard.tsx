import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfHalfYear,
  endOfHalfYear,
  isWithinInterval,
  parseISO,
  addDays,
  differenceInDays,
} from 'date-fns'
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

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [loading, setLoading] = useState(true)
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [parcelas, setParcelas] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [pastos, setPastos] = useState<any[]>([])
  const [iatfs, setIatfs] = useState<any[]>([])
  const [chartFilter, setChartFilter] = useState<'ALL' | 'FIXA' | 'VARIÁVEL'>('ALL')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [tRes, pRes, aRes, paRes, iRes] = await Promise.all([
          pb.collection('transacoes_financeiras').getFullList({ expand: 'parceiro_id' }),
          pb.collection('parcelas_venda').getFullList({ expand: 'venda_id.cliente_id' }),
          pb
            .collection('animais')
            .getFullList({ filter: "status != 'Vendido' && status != 'Morto'" }),
          pb.collection('pastos_e_piquetes').getFullList(),
          pb.collection('manejo_iatf_curral').getFullList(),
        ])
        setTransacoes(tRes)
        setParcelas(pRes)
        setAnimais(aRes)
        setPastos(paRes)
        setIatfs(iRes)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTransacoes = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return transacoes
    return transacoes.filter((t) => {
      const d = parseISO(t.data_vencimento)
      return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! })
    })
  }, [transacoes, dateRange])

  const filteredParcelas = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return parcelas
    return parcelas.filter((p) => {
      const d = parseISO(p.data_vencimento)
      return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! })
    })
  }, [parcelas, dateRange])

  // Summary KPIs
  const receitas = filteredTransacoes
    .filter((t) => t.tipo_movimento === 'Receita')
    .reduce((a, b) => a + b.valor_total, 0)
  const despesas = filteredTransacoes
    .filter((t) => t.tipo_movimento === 'Despesa')
    .reduce((a, b) => a + b.valor_total, 0)
  const saldo = receitas - despesas
  const margem = receitas > 0 ? (saldo / receitas) * 100 : 0

  // Delinquency Panel
  const today = new Date()
  const in30Days = addDays(today, 30)

  const parcelasEmAberto = filteredParcelas.filter(
    (p) => p.status_parcela === 'Atrasada' || p.status_parcela === 'Pendente',
  )
  const valorEmAberto = parcelasEmAberto.reduce((acc, p) => acc + p.valor_parcela, 0)

  const previsao30Dias = parcelas
    .filter((p) => {
      if (p.status_parcela === 'Paga' || p.status_parcela === 'Cancelada') return false
      const vDate = parseISO(p.data_vencimento)
      return vDate >= today && vDate <= in30Days
    })
    .reduce((acc, p) => acc + p.valor_parcela, 0)

  const parcelasPagas = filteredParcelas
    .filter((p) => p.status_parcela === 'Paga')
    .reduce((acc, p) => acc + p.valor_parcela, 0)
  const parcelasAtrasadas = filteredParcelas
    .filter(
      (p) =>
        p.status_parcela === 'Atrasada' ||
        (p.status_parcela === 'Pendente' && parseISO(p.data_vencimento) < today),
    )
    .reduce((acc, p) => acc + p.valor_parcela, 0)

  const pieData = [
    { name: 'Pagas', value: parcelasPagas, color: '#094016' },
    { name: 'Atrasadas', value: parcelasAtrasadas, color: '#dc2626' },
  ]

  const tableData = parcelas
    .filter(
      (p) =>
        p.status_parcela === 'Atrasada' ||
        (p.status_parcela === 'Pendente' && parseISO(p.data_vencimento) < today),
    )
    .map((p) => {
      const cliente = p.expand?.venda_id?.expand?.cliente_id
      const vDate = parseISO(p.data_vencimento)
      return {
        id: p.id,
        clienteNome: cliente?.nome_razao_social || 'Desconhecido',
        clientePhone: cliente?.contato_whatsapp,
        diasAtraso: differenceInDays(today, vDate),
        valor: p.valor_parcela,
        vencimento: p.data_vencimento,
      }
    })
    .sort((a, b) => b.diasAtraso - a.diasAtraso)
    .slice(0, 10)

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
  }

  // Health Metrics
  const totalVariavel = filteredTransacoes
    .filter((t) => t.tipo_movimento === 'Despesa' && t.classificacao_custo === 'VARIÁVEL')
    .reduce((acc, t) => acc + t.valor_total, 0)
  const totalArrobas = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0) / 15, 0)
  const custoArroba = totalArrobas > 0 ? totalVariavel / totalArrobas : 0

  const totalArea = pastos.reduce((acc, p) => acc + (p.area_hectares || 0), 0)
  const lotacao = totalArea > 0 ? animais.length / totalArea : 0

  const prenhes = iatfs.filter((i) => i.resultado_dg === 'Prenhe').length
  const taxaPrenhez = iatfs.length > 0 ? (prenhes / iatfs.length) * 100 : 0

  const desembolsoCabeca = animais.length > 0 ? despesas / animais.length : 0

  // Chart Data
  const chartData = useMemo(() => {
    const map: Record<string, { name: string; Receitas: number; Despesas: number }> = {}
    filteredTransacoes.forEach((t) => {
      const d = parseISO(t.data_vencimento)
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
  }, [filteredTransacoes, chartFilter])

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
      const evs = transacoes.filter(
        (t) => t.tipo_movimento === 'Despesa' && t.data_vencimento.startsWith(dateStr),
      )
      days.push({
        date: i,
        events: evs,
        isToday: dateStr === format(new Date(), 'yyyy-MM-dd'),
      })
    }
    return days
  }, [monthStart, monthEnd, transacoes])

  const totalPeriodoCalendario = calendarDays.reduce((acc, d) => {
    if (!d) return acc
    return acc + d.events.reduce((sum: number, ev: any) => sum + ev.valor_total, 0)
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
              setDateRange({ from: startOfHalfYear(new Date()), to: endOfHalfYear(new Date()) })
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
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
            <div className="text-lg md:text-xl font-bold text-[#094016]">{animais.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Status diferente de vendido/morto
            </p>
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
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
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
                  tableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell
                        className="font-semibold text-xs truncate max-w-[120px]"
                        title={row.clienteNome}
                      >
                        {row.clienteNome}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(parseISO(row.vencimento), 'dd/MM/yyyy')}
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
                            title={`${ev.descricao_lancamento} - ${formatCurrency(ev.valor_total)}`}
                          >
                            {formatCurrency(ev.valor_total)}
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
