import { useState, useEffect, useMemo } from 'react'
import { Download, DollarSign, Activity, AlertCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { exportFluxoCaixaPDF } from '@/lib/pdf'
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FluxoCharts } from './components/FluxoCharts'
import { FluxoTables } from './components/FluxoTables'

export default function FluxoDeCaixa() {
  const [parcelas, setParcelas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  const [period, setPeriod] = useState('all')
  const [client, setClient] = useState('all')
  const [livestockType, setLivestockType] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('all')

  const loadData = async () => {
    try {
      const [pRes, dRes, cRes] = await Promise.all([
        pb.collection('parcelas_venda').getFullList({ expand: 'venda_id,venda_id.cliente_id' }),
        pb
          .collection('transacoes_financeiras')
          .getFullList({ filter: "tipo_movimento = 'Despesa'" }),
        pb.collection('parceiros_negocios').getFullList(),
      ])
      setParcelas(pRes)
      setDespesas(dRes)
      setClientes(cRes)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('parcelas_venda', loadData)
  useRealtime('transacoes_financeiras', loadData)
  useRealtime('vendas', loadData)

  const filteredParcelas = useMemo(() => {
    const now = new Date()
    return parcelas.filter((p) => {
      let dMatch = true
      const d = new Date(p.data_vencimento)
      if (period === 'current_month') dMatch = d >= startOfMonth(now) && d <= endOfMonth(now)
      else if (period === 'quarter') dMatch = d >= subMonths(now, 3) && d <= now
      else if (period === 'year') dMatch = d >= startOfYear(now) && d <= endOfYear(now)

      const v = p.expand?.venda_id
      return (
        dMatch &&
        (client === 'all' || v?.cliente_id === client) &&
        (livestockType === 'all' || v?.tipo_gado === livestockType) &&
        (paymentMethod === 'all' || v?.forma_pagamento === paymentMethod)
      )
    })
  }, [parcelas, period, client, livestockType, paymentMethod])

  const filteredDespesas = useMemo(() => {
    const now = new Date()
    return despesas.filter((d) => {
      if (period === 'all') return true
      const date = new Date(d.data_competencia)
      if (period === 'current_month') return date >= startOfMonth(now) && date <= endOfMonth(now)
      if (period === 'quarter') return date >= subMonths(now, 3) && date <= now
      if (period === 'year') return date >= startOfYear(now) && date <= endOfYear(now)
      return true
    })
  }, [despesas, period])
  const totalExpenses = filteredDespesas.reduce((acc, d) => acc + d.valor_total, 0)

  const kpis = useMemo(() => {
    let expected = 0,
      realized = 0,
      arrears = 0
    filteredParcelas.forEach((p) => {
      if (p.status_parcela === 'Pendente') expected += p.valor_parcela
      if (p.status_parcela === 'Paga') realized += p.valor_parcela
      if (p.status_parcela === 'Atrasada') arrears += p.valor_parcela
    })
    const total = expected + realized + arrears
    return { expected, realized, arrears, inadimplencia: total ? (arrears / total) * 100 : 0 }
  }, [filteredParcelas])

  const chartData = useMemo(() => {
    const lineMap: Record<string, any> = {}
    const barMap: Record<string, number> = { Comercial: 0, PO: 0 }
    const pieMap: Record<string, number> = { AVista: 0, Parcelado: 0 }

    filteredParcelas.forEach((p) => {
      const d = new Date(
        p.status_parcela === 'Paga' ? p.data_pagamento || p.data_vencimento : p.data_vencimento,
      )
      const mKey = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (!lineMap[mKey]) lineMap[mKey] = { month: mKey, realized: 0, expected: 0 }
      if (p.status_parcela === 'Paga') lineMap[mKey].realized += p.valor_parcela
      else if (p.status_parcela === 'Pendente') lineMap[mKey].expected += p.valor_parcela

      const v = p.expand?.venda_id
      if (v?.tipo_gado) barMap[v.tipo_gado] = (barMap[v.tipo_gado] || 0) + p.valor_parcela
      if (v?.forma_pagamento)
        pieMap[v.forma_pagamento] = (pieMap[v.forma_pagamento] || 0) + p.valor_parcela
    })

    return {
      line: Object.values(lineMap),
      bar: Object.entries(barMap).map(([name, value]) => ({ name, value })),
      pie: Object.entries(pieMap).map(([name, value]) => ({ name, value })),
    }
  }, [filteredParcelas])

  const tablesData = useMemo(() => {
    const limit = addDays(new Date(), 30)
    return {
      upcoming: filteredParcelas
        .filter((p) => p.status_parcela === 'Pendente' && new Date(p.data_vencimento) <= limit)
        .sort(
          (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime(),
        ),
      overdue: filteredParcelas
        .filter((p) => p.status_parcela === 'Atrasada' && (p.dias_atraso || 0) > 5)
        .sort((a, b) => (b.dias_atraso || 0) - (a.dias_atraso || 0)),
    }
  }, [filteredParcelas])

  return (
    <div className="space-y-6 p-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Fluxo de Caixa</h1>
        <Button
          onClick={() =>
            exportFluxoCaixaPDF(kpis, totalExpenses, {
              period,
              client,
              livestockType,
              paymentMethod,
            })
          }
        >
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="current_month">Mês Atual</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger>
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome_razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={livestockType} onValueChange={setLivestockType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Gado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="Comercial">Comercial</SelectItem>
            <SelectItem value="PO">PO</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Forma Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Formas</SelectItem>
            <SelectItem value="AVista">À Vista</SelectItem>
            <SelectItem value="Parcelado">Parcelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            title: 'Receita Esperada',
            val: kpis.expected,
            icon: DollarSign,
            color: 'text-blue-600',
          },
          {
            title: 'Receita Realizada',
            val: kpis.realized,
            icon: Activity,
            color: 'text-green-600',
          },
          { title: 'Atraso Total', val: kpis.arrears, icon: AlertCircle, color: 'text-red-600' },
          {
            title: 'Inadimplência %',
            val: `${kpis.inadimplencia.toFixed(1)}%`,
            icon: AlertCircle,
            color: 'text-orange-500',
            isText: true,
          },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{k.title}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {k.isText
                  ? k.val
                  : `R$ ${(k.val as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FluxoCharts data={chartData} />
      <FluxoTables upcoming={tablesData.upcoming} overdue={tablesData.overdue} />
    </div>
  )
}
