import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [data, setData] = useState({
    receitaMes: 0,
    despesaMes: 0,
    resultado: 0,
    aReceber: 0,
    aPagar: 0,
    inadimplencia: 0,
    capitalGiro: 0,
    alertas: [] as any[],
  })

  useEffect(() => {
    async function loadData() {
      try {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0]

        const [transacoes, parcelas, boletos] = await Promise.all([
          pb.collection('transacoes_financeiras').getFullList({
            filter: `data_vencimento >= '${firstDay}' && data_vencimento <= '${lastDay}'`,
          }),
          pb.collection('parcelas_venda').getFullList({
            filter: "status_parcela = 'Pendente' || status_parcela = 'Atrasada'",
            expand: 'venda_id.cliente_id',
          }),
          pb.collection('boletos_pagar').getFullList({
            filter: "status = 'Pendente' || status = 'Atrasado'",
            expand: 'fornecedor_id',
          }),
        ])

        let rec = 0,
          desp = 0
        transacoes.forEach((t) => {
          if (t.tipo_movimento === 'Receita') rec += t.valor_total
          if (t.tipo_movimento === 'Despesa') desp += t.valor_total
        })

        let aRec = 0,
          inad = 0
        const alertas = []
        parcelas.forEach((p) => {
          if (p.status_parcela === 'Pendente') aRec += p.valor_parcela
          if (p.status_parcela === 'Atrasada') {
            inad += p.valor_parcela
            alertas.push({
              type: 'Recebimento Atrasado',
              value: p.valor_parcela,
              date: p.data_vencimento,
              ref: p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'Cliente',
            })
          }
        })

        let aPag = 0
        boletos.forEach((b) => {
          if (b.status === 'Pendente') aPag += b.valor
          if (b.status === 'Atrasado') {
            aPag += b.valor
            alertas.push({
              type: 'Pagamento Atrasado',
              value: b.valor,
              date: b.data_vencimento,
              ref: b.expand?.fornecedor_id?.nome_razao_social || 'Fornecedor',
            })
          }
        })

        setData({
          receitaMes: rec,
          despesaMes: desp,
          resultado: rec - desp,
          aReceber: aRec,
          aPagar: aPag,
          inadimplencia: inad,
          capitalGiro: aRec - aPag,
          alertas: alertas
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5),
        })
      } catch (e) {
        console.error('Dashboard error', e)
      }
    }
    loadData()
  }, [])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 pb-8 font-sans">
      <div>
        <h1 className="text-4xl font-serif text-[#10213d]">Executive Command Center</h1>
        <p className="text-slate-500 mt-1">Visão Estratégica & Financeira do Mês Atual</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#10213d] text-white border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Resultado do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{fmt(data.resultado)}</div>
            <p className="text-xs text-slate-400 mt-1">Receitas - Despesas (Mês corrente)</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{fmt(data.receitaMes)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Despesa Mensal</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{fmt(data.despesaMes)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Capital de Giro (Pendente)
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{fmt(data.capitalGiro)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Contas a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{fmt(data.aReceber)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Contas a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{fmt(data.aPagar)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Índice de Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(data.inadimplencia)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b bg-slate-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-serif text-[#10213d]">
            <AlertCircle className="w-5 h-5 text-red-500" /> Alertas de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {data.alertas.length === 0 ? (
            <div className="text-slate-500 text-sm py-4 text-center">
              Nenhum atraso registrado. O fluxo de caixa está em dia.
            </div>
          ) : (
            <div className="space-y-4">
              {data.alertas.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{a.type}</div>
                      <div className="text-xs text-slate-500">
                        {a.ref} • Vencimento: {format(new Date(a.date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-red-600">{fmt(a.value)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
