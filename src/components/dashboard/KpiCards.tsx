import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Users } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function KpiCards() {
  const { state } = useAppStore()

  const receitas = state.transacoes
    .filter((t) => t.Tipo_Movimento === 'Receita' && t.Status_Pagamento === 'Efetivado')
    .reduce((acc, t) => acc + t.Valor_Total, 0)
  const despesas = state.transacoes
    .filter((t) => t.Tipo_Movimento === 'Despesa' && t.Status_Pagamento === 'Efetivado')
    .reduce((acc, t) => acc + t.Valor_Total, 0)
  const saldo = receitas - despesas
  const activeAnimals = state.animais.filter((a) => a.status === 'Ativo').length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Receitas Realizadas</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {formatCurrency(receitas)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform border-l-4 border-l-rose-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Despesas Realizadas</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            {formatCurrency(despesas)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Saldo Atual</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold font-mono ${saldo >= 0 ? 'text-blue-700' : 'text-rose-700'}`}
          >
            {formatCurrency(saldo)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Cabeças Ativas</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary font-mono">{activeAnimals}</div>
        </CardContent>
      </Card>
    </div>
  )
}
