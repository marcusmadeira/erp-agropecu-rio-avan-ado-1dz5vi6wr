import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Wallet, MessageSquare, Download } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { exportFluxoCaixaPDF } from '@/lib/pdf'

export default function FluxoDeCaixa() {
  const [parcelas, setParcelas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        pb.collection('parcelas_venda').getFullList({ expand: 'venda_id,venda_id.cliente_id' }),
        pb
          .collection('transacoes_financeiras')
          .getFullList({ filter: "tipo_movimento = 'Despesa'" }),
      ])
      setParcelas(pRes)
      setDespesas(dRes)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('parcelas_venda', loadData)
  useRealtime('transacoes_financeiras', loadData)

  const {
    receitasPagas,
    receitasPendentes,
    atrasosTotal,
    despesasTotais,
    chartData,
    parcelasPendentes,
  } = useMemo(() => {
    let rPagas = 0
    let rPendentes = 0
    let aTotal = 0

    const list: any[] = []

    parcelas.forEach((p) => {
      const val = p.valor_parcela || 0
      if (p.status_parcela === 'Paga') {
        rPagas += val
      } else if (p.status_parcela === 'Atrasada') {
        aTotal += val
        list.push(p)
      } else if (p.status_parcela === 'Pendente') {
        rPendentes += val
        list.push(p)
      }
    })

    const dTotais = despesas.reduce((acc, d) => acc + (d.valor_total || 0), 0)

    const cData = [
      { name: 'Receita Realizada', value: rPagas, color: '#10b981' },
      { name: 'Receita Esperada', value: rPendentes, color: '#3b82f6' },
      { name: 'Atrasos (Inadimplência)', value: aTotal, color: '#ef4444' },
    ].filter((i) => i.value > 0)

    return {
      receitasPagas: rPagas,
      receitasPendentes: rPendentes,
      atrasosTotal: aTotal,
      despesasTotais: dTotais,
      chartData: cData,
      parcelasPendentes: list.sort(
        (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime(),
      ),
    }
  }, [parcelas, despesas])

  const inadimplenciaPercent =
    receitasPagas + atrasosTotal > 0
      ? ((atrasosTotal / (receitasPagas + atrasosTotal)) * 100).toFixed(1)
      : '0.0'

  const saldoRealizado = receitasPagas - despesasTotais

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const openWhatsApp = (p: any) => {
    const cliente = p.expand?.venda_id?.expand?.cliente_id
    if (!cliente?.contato_whatsapp) {
      alert('Cliente não possui WhatsApp cadastrado.')
      return
    }
    const phone = cliente.contato_whatsapp.replace(/\D/g, '')
    const text = `Olá ${cliente.nome_razao_social}, verificamos uma parcela em aberto no valor de ${formatCurrency(p.valor_parcela)} com vencimento em ${format(new Date(p.data_vencimento), 'dd/MM/yyyy')}. Segue o link para pagamento: ...`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleExportPDF = () => {
    exportFluxoCaixaPDF(
      {
        realized: receitasPagas,
        expected: receitasPendentes,
        arrears: atrasosTotal,
      },
      despesasTotais,
      { period: 'all', client: 'all', livestockType: 'all', paymentMethod: 'all' },
    )
  }

  if (loading) return <div className="p-8 text-center">Carregando fluxo de caixa...</div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Fluxo de Caixa Consolidado</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe receitas, recebimentos, inadimplência e saldo financeiro.
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        >
          <Download className="w-4 h-4 mr-2" /> Relatório PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 flex justify-between">
              Receita Realizada (Paga) <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {formatCurrency(receitasPagas)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 flex justify-between">
              Receita Esperada (Pendente) <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {formatCurrency(receitasPendentes)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 flex justify-between">
              Atraso Total (Vencidas) <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 font-mono">
              {formatCurrency(atrasosTotal)}
            </div>
            <p className="text-xs font-semibold text-red-600 mt-1">
              {inadimplenciaPercent}% Inadimplência
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-gray-800 bg-gray-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-400 flex justify-between">
              Saldo Realizado Líquido <Wallet className="h-4 w-4 text-gray-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${saldoRealizado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {formatCurrency(saldoRealizado)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Despesas Realizadas: {formatCurrency(despesasTotais)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle>Composição de Receitas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Próximos Vencimentos e Inadimplentes</CardTitle>
            <CardDescription>
              Cobrança direta via WhatsApp para parcelas em aberto e atrasadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[300px] p-0">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelasPendentes.map((p) => {
                  const cliente = p.expand?.venda_id?.expand?.cliente_id
                  const isAtrasada = p.status_parcela === 'Atrasada'
                  const days = differenceInDays(new Date(), new Date(p.data_vencimento))
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-gray-900">
                        {cliente?.nome_razao_social || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(p.data_vencimento), 'dd/MM/yyyy')}
                        {isAtrasada && (
                          <div className="text-xs text-red-500 font-semibold">
                            {days} dias de atraso
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isAtrasada
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }
                        >
                          {p.status_parcela}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(p.valor_parcela)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => openWhatsApp(p)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {parcelasPendentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      Nenhuma parcela pendente ou atrasada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
