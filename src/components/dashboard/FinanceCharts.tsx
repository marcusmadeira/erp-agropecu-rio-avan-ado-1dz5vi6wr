import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Transacao } from '@/stores/types'
import useAppStore from '@/stores/useAppStore'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/components/dashboard/KpiCards'
import { Beef } from 'lucide-react'

export default function FinanceCharts({ transactions }: { transactions: Transacao[] }) {
  const { state } = useAppStore()
  const [showVariableOnly, setShowVariableOnly] = useState(false)

  const chartData = useMemo(() => {
    const monthsMap: Record<string, { Receitas: number; Despesas: number }> = {}

    transactions.forEach((t) => {
      if (showVariableOnly && t.Classificacao_Custo === 'Fixo') return
      const date = new Date(t.Data_Competencia || t.Data_Vencimento)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthsMap[key]) monthsMap[key] = { Receitas: 0, Despesas: 0 }

      if (t.Tipo_Movimento === 'Receita' && t.Status_Pagamento === 'Efetivado')
        monthsMap[key].Receitas += t.Valor_Total
      if (t.Tipo_Movimento === 'Despesa' && t.Status_Pagamento === 'Efetivado')
        monthsMap[key].Despesas += t.Valor_Total
    })

    return Object.keys(monthsMap)
      .sort()
      .map((k) => ({
        name: k,
        Receitas: monthsMap[k].Receitas,
        Despesas: monthsMap[k].Despesas,
      }))
  }, [transactions, showVariableOnly])

  const globalArrobaCost = useMemo(() => {
    let totalCost = 0
    let totalWeightGain = 0
    state.animais.forEach((a) => {
      totalCost += a.custoAcumulado || 0
      totalWeightGain += a.pesoAtual - (a.pesoEntrada || a.pesoAtual)
    })
    const fixedCosts = state.transacoes
      .filter(
        (t) => t.Tipo_Movimento === 'Despesa' && t.Centro_Custo_Direcionado.includes('Rateio'),
      )
      .reduce((acc, t) => acc + t.Valor_Total, 0)
    totalCost += fixedCosts
    const arr = totalWeightGain / 30
    return arr > 0 ? totalCost / arr : 0
  }, [state.animais, state.transacoes])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2 shadow-subtle">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Oscilação Financeira (Caixa Efetivo)</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="var-only"
              checked={showVariableOnly}
              onCheckedChange={setShowVariableOnly}
            />
            <Label htmlFor="var-only" className="text-xs">
              Ocultar Custo Fixo
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
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
                <Bar dataKey="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-subtle bg-slate-50 border-t-4 border-t-accent">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Beef className="w-5 h-5 text-accent" /> KPI: Custo da Arroba (@)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-4xl font-bold text-accent font-mono">
              {formatCurrency(globalArrobaCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Custo global médio (Fixo + Var)</p>
          </div>
          <div className="space-y-3 border-t pt-4 border-border">
            {state.lotes.map((l) => {
              const aLot = state.animais.filter((a) => a.loteId === l.id && a.status === 'Ativo')
              const gain = aLot.reduce(
                (acc, a) => acc + (a.pesoAtual - (a.pesoEntrada || a.pesoAtual)),
                0,
              )
              const costVar = aLot.reduce((acc, a) => acc + (a.custoAcumulado || 0), 0)
              const arr = gain / 30
              const cst = arr > 0 ? costVar / arr : 0
              return (
                <div key={l.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-secondary truncate w-32" title={l.name}>
                    {l.name}
                  </span>
                  <span className="font-mono text-slate-600">
                    {formatCurrency(cst)} <span className="text-[10px]">(@ var)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
