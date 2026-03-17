import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Activity, Users, Box } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function KpiCards() {
  const { state } = useAppStore()

  const caixaRealizado = state.transacoes.reduce((acc, t) => {
    if (t.status !== 'Pago') return acc
    return t.type === 'Receita' ? acc + t.value : acc - t.value
  }, 0)

  const activeAnimals = state.animais.filter((a) => a.status === 'Ativo').length

  const currentMonth = new Date().getMonth()
  const desembolso = state.transacoes
    .filter(
      (t) =>
        t.type === 'Despesa' && t.status === 'Pago' && new Date(t.date).getMonth() === currentMonth,
    )
    .reduce((acc, t) => acc + t.value, 0)
  const desembolsoPorCabeca = activeAnimals > 0 ? desembolso / activeAnimals : 0

  const gmdMedio =
    activeAnimals > 0
      ? state.animais.filter((a) => a.status === 'Ativo').reduce((acc, a) => acc + a.gmd, 0) /
        activeAnimals
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900/70">Caixa Realizado</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 font-mono">
            {formatCurrency(caixaRealizado)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900/70">
            Desembolso Cab/Mês
          </CardTitle>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 font-mono">
            {formatCurrency(desembolsoPorCabeca)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900/70">
            GMD Médio Global
          </CardTitle>
          <Activity className="h-4 w-4 text-emerald-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 font-mono">
            {gmdMedio.toFixed(3)} kg/d
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900/70">Animais Ativos</CardTitle>
          <Users className="h-4 w-4 text-emerald-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 font-mono">{activeAnimals}</div>
        </CardContent>
      </Card>
    </div>
  )
}
