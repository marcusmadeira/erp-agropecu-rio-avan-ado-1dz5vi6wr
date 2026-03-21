import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import useAppStore from '@/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Beef } from 'lucide-react'

export default function NutricaoEficiencia() {
  const { state } = useAppStore()
  const [filterCC, setFilterCC] = useState('ALL')

  const chartData = useMemo(() => {
    const lotesFilter =
      filterCC === 'ALL' ? state.lotes : state.lotes.filter((l) => l.costCenter === filterCC)

    // Calculate fixed costs not tied to specific lots (e.g. Rateio)
    const fixedCosts = state.transacoes
      .filter(
        (t) => t.Tipo_Movimento === 'Despesa' && t.Centro_Custo_Direcionado.includes('Rateio'),
      )
      .reduce((acc, t) => acc + t.Valor_Total, 0)

    const totalHeadCount = state.animais.filter((a) => a.status === 'Ativo').length
    const fixedCostPerHead = totalHeadCount > 0 ? fixedCosts / totalHeadCount : 0

    return lotesFilter.map((lote) => {
      // Sum Variable Costs of Lot
      const loteManejos = state.manejos.filter((m) => m.loteId === lote.id)
      const custoVariavelNutricao = loteManejos.reduce((acc, m) => acc + (m.cost || 0), 0)

      // Get animals and calculate Total Gain
      const animais = state.animais.filter((a) => a.loteId === lote.id && a.status === 'Ativo')
      const totalGainKg = animais.reduce(
        (acc, a) => acc + (a.pesoAtual - (a.pesoEntrada || a.pesoAtual)),
        0,
      )

      // Proportional Fixed Cost
      const custoFixoProporcional = fixedCostPerHead * animais.length
      const custoTotalLote = custoVariavelNutricao + custoFixoProporcional

      const avgGmd =
        animais.length > 0 ? animais.reduce((acc, a) => acc + a.gmd, 0) / animais.length : 0

      // Formula: (Sum of Variable + Proportional Fixed) / ((Final Weight - Initial Weight) / 30)
      const arrobasProduced = totalGainKg / 30
      const custoArroba = arrobasProduced > 0 ? custoTotalLote / arrobasProduced : 0

      return {
        name: lote.name,
        custoTotal: custoTotalLote,
        gmd: Number(avgGmd.toFixed(3)),
        custoArroba,
      }
    })
  }, [state.lotes, state.manejos, state.animais, state.transacoes, filterCC])

  const chartConfig = {
    custoTotal: { label: 'Custo Total', color: 'hsl(var(--chart-2))' },
    gmd: { label: 'GMD', color: 'hsl(var(--chart-1))' },
  }

  const globalArrobaCost =
    chartData.length > 0
      ? chartData.reduce((acc, curr) => acc + curr.custoArroba, 0) / chartData.length
      : 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-emerald-900">Eficiência Nutricional</h2>
        <Select value={filterCC} onValueChange={setFilterCC}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Centro de Custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos C.C.</SelectItem>
            <SelectItem value="CC01-PO">CC01-PO</SelectItem>
            <SelectItem value="CC02-TIP">CC02-TIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Custo Médio / Arroba Produzida (@)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 font-mono">
              {formatCurrency(globalArrobaCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inclui custos fixos proporcionais e nutrição.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Lotes Analisados
            </CardTitle>
            <Beef className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 font-mono">{chartData.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle mt-4">
        <CardHeader>
          <CardTitle className="text-emerald-900">
            Correlação: Custo Acumulado vs Ganho Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="var(--color-custoTotal)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-gmd)" />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="custoTotal"
                name="Custo Total do Lote (R$)"
                fill="var(--color-custoTotal)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="gmd"
                name="GMD Médio (kg)"
                fill="var(--color-gmd)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
