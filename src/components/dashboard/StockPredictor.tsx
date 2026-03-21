import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import useAppStore from '@/stores/useAppStore'

export default function StockPredictor() {
  const { state } = useAppStore()

  const stockData = useMemo(() => {
    const keyItems = state.estoque.filter((e) => e.category === 'Nutrição' && e.quantity > 0)

    return keyItems
      .map((item) => {
        // Calculate daily burn based on active animals
        const activeHeads = state.animais.filter((a) => a.status === 'Ativo').length
        // Simulate realistic daily burn if no history (e.g. Corn 2kg/day, Salt 0.1kg/day)
        const isSalt =
          item.name.toLowerCase().includes('sal') || item.name.toLowerCase().includes('mineral')
        const burnPerHead = isSalt ? 0.1 : 1.5
        const dailyBurn = burnPerHead * activeHeads

        const daysRemaining = dailyBurn > 0 ? Math.floor(item.quantity / dailyBurn) : 999
        const criticalPoint = item.minStock || 500

        return {
          name: item.name.split(' ')[0], // short name
          fullName: item.name,
          qty: item.quantity,
          min: criticalPoint,
          days: daysRemaining,
        }
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 5) // top 5 critical
  }, [state.estoque, state.animais])

  return (
    <Card className="shadow-subtle border-t-4 border-t-indigo-500">
      <CardHeader>
        <CardTitle>Estoque Preditivo (Nutrição)</CardTitle>
        <CardDescription>Dias de autonomia baseados no consumo diário.</CardDescription>
      </CardHeader>
      <CardContent>
        {stockData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer>
                <BarChart
                  data={stockData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number, n: string) => [v, n === 'qty' ? 'Qtd (Kg)' : n]}
                  />
                  <Bar dataKey="qty" fill="hsl(var(--indigo-500, #6366f1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {stockData.map((s) => (
                <div
                  key={s.name}
                  className="flex justify-between items-center text-sm border-b pb-1 last:border-0"
                >
                  <span className="font-medium text-slate-700 truncate w-32" title={s.fullName}>
                    {s.fullName}
                  </span>
                  {s.days < 15 ? (
                    <span className="text-rose-600 font-bold font-mono bg-rose-50 px-2 py-0.5 rounded">
                      {s.days} dias rest.
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold font-mono">{s.days} dias</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Sem dados de estoque.</div>
        )}
      </CardContent>
    </Card>
  )
}
