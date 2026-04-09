import { useMemo } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PesagemDiaria } from '@/services/pesagens'

interface Props {
  data: PesagemDiaria[]
  animalFilter: string
}

export default function PesagemChart({ data, animalFilter }: Props) {
  const { chartData, gmd } = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.data_pesagem).getTime() - new Date(b.data_pesagem).getTime(),
    )
    const mapped = sorted.map((d) => ({
      date: format(parseISO(d.data_pesagem), 'dd/MM/yyyy'),
      peso: d.peso_kg,
    }))

    let gmdVal = null
    if (animalFilter && animalFilter !== 'all' && sorted.length > 1) {
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const days = differenceInDays(parseISO(last.data_pesagem), parseISO(first.data_pesagem))
      if (days > 0) {
        gmdVal = ((last.peso_kg - first.peso_kg) / days).toFixed(3)
      }
    }
    return { chartData: mapped, gmd: gmdVal }
  }, [data, animalFilter])

  const chartConfig = { peso: { label: 'Peso (kg)', color: 'hsl(var(--primary))' } }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-4 border-b bg-slate-900 text-white rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Evolução de Peso & GMD
        </CardTitle>
        <CardDescription className="text-slate-300">
          {gmd
            ? `Ganho Médio Diário (GMD): ${gmd} kg/dia`
            : 'Selecione um animal com mais de uma pesagem para ver o GMD.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: '#64748b' }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#64748b' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="var(--color-peso)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-peso)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Info className="w-8 h-8 mb-2 opacity-50" />
            <p>Nenhum dado de pesagem para exibir no gráfico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
