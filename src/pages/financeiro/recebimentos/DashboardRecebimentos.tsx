import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { format, isSameMonth } from 'date-fns'

export default function DashboardRecebimentos({ boletos }: { boletos: any[] }) {
  const hoje = new Date()

  let aReceber = 0
  let recebidoMes = 0
  let emAtraso = 0
  let totalEsperado = 0

  const statusCount = { Pago: 0, Pendente: 0, Atrasado: 0 }
  const evolution: Record<string, number> = {}

  boletos.forEach((b) => {
    const valor = b.valor_boleto || b.expand?.parcela_id?.valor_parcela || 0
    const status = b.status_boleto
    const dtVenc = b.data_vencimento ? new Date(b.data_vencimento) : hoje

    totalEsperado += valor

    if (status === 'Pago') {
      statusCount.Pago += 1
      if (
        b.expand?.parcela_id?.data_pagamento &&
        isSameMonth(new Date(b.expand.parcela_id.data_pagamento), hoje)
      ) {
        recebidoMes += valor
      }
    } else if (status === 'Vencido' || (status !== 'Pago' && dtVenc < hoje)) {
      statusCount.Atrasado += 1
      emAtraso += valor
    } else {
      statusCount.Pendente += 1
      aReceber += valor
    }

    const monthKey = format(dtVenc, 'MMM/yy')
    if (!evolution[monthKey]) evolution[monthKey] = 0
    if (status === 'Pago') evolution[monthKey] += valor
  })

  const taxaInadimplencia = totalEsperado > 0 ? (emAtraso / totalEsperado) * 100 : 0

  const pieData = [
    { name: 'Pago', value: statusCount.Pago, fill: '#094016' },
    { name: 'Pendente', value: statusCount.Pendente, fill: '#f59e0b' },
    { name: 'Atrasado', value: statusCount.Atrasado, fill: '#dc2626' },
  ]

  const lineData = Object.entries(evolution)
    .map(([name, value]) => ({ name, value }))
    .reverse()
    .slice(0, 12)
    .reverse()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {aReceber.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recebido Este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {recebidoMes.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {emAtraso.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaInadimplencia.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Recebimentos (12m)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ value: { label: 'Recebido', color: '#094016' } }}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="var(--color-value)" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
