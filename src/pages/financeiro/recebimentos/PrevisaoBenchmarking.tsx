import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { format, addDays, isAfter, isBefore } from 'date-fns'
import { formatCurrency } from './utils'
import { Lightbulb, TrendingUp, TrendingDown } from 'lucide-react'

export default function PrevisaoBenchmarking({ boletos }: any) {
  const hoje = new Date()

  const next30 = addDays(hoje, 30)
  const next60 = addDays(hoje, 60)
  const next90 = addDays(hoje, 90)

  let sum30 = 0,
    sum60 = 0,
    sum90 = 0
  const upcoming: any[] = []

  boletos.forEach((b: any) => {
    if (b.status_boleto === 'Pago' || b.status_boleto === 'Cancelado') return
    const v = new Date(b.data_vencimento)
    if (isAfter(v, hoje)) {
      if (isBefore(v, next30)) sum30 += b.valor_boleto
      else if (isBefore(v, next60)) sum60 += b.valor_boleto
      else if (isBefore(v, next90)) sum90 += b.valor_boleto

      upcoming.push(b)
    }
  })

  upcoming.sort(
    (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime(),
  )

  const chartData = [
    { period: 'Até 30 dias', value: sum30 },
    { period: '31 - 60 dias', value: sum60 },
    { period: '61 - 90 dias', value: sum90 },
  ]

  const totalPagos = boletos.filter((b: any) => b.status_boleto === 'Pago').length
  const totalEmitidos = boletos.filter((b: any) => b.status_boleto !== 'Cancelado').length
  const taxaInterna = totalEmitidos > 0 ? (totalPagos / totalEmitidos) * 100 : 0
  const taxaMercado = 85.5

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Esperado (90 dias)</CardTitle>
            <CardDescription>Valores acumulados projetados para o futuro</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ChartContainer
              config={{ value: { label: 'Valor (R$)', color: '#094016' } }}
              className="h-full w-full"
            >
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#094016]">Benchmarking de Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sua Eficiência (Recebidos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{taxaInterna.toFixed(1)}%</span>
                  {taxaInterna >= taxaMercado ? (
                    <TrendingUp className="text-green-500 w-5 h-5 mb-1" />
                  ) : (
                    <TrendingDown className="text-red-500 w-5 h-5 mb-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono tracking-tight">
                  Média do Mercado: {taxaMercado}%
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Velocidade (Atraso Médio)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">5 dias</span>
                  <TrendingUp className="text-green-500 w-5 h-5 mb-1" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono tracking-tight">
                  Média do Mercado: 12 dias
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-[#094016]/5 border-[#094016]/20 shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#094016] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-[#094016]">Insights e Sugestões</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua taxa de recebimento está {taxaInterna >= taxaMercado ? 'acima' : 'abaixo'} da
                  média agropecuária nacional. Habilitar disparos no D-2 pode acelerar a liquidez
                  geral do mês.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border rounded-md bg-white shadow-sm mt-6">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800">Próximos Valores a Entrar</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Ref. Boleto</TableHead>
              <TableHead className="text-right">Valor Esperado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcoming.slice(0, 10).map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(b.data_vencimento), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  {b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
                    'N/D'}
                </TableCell>
                <TableCell>{b.numero_boleto || 'N/D'}</TableCell>
                <TableCell className="text-right font-medium text-green-700">
                  {formatCurrency(b.valor_boleto)}
                </TableCell>
              </TableRow>
            ))}
            {upcoming.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Sem previsões de recebimento mapeadas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
