import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useAppStore from '@/stores/useAppStore'
import { Beef, Baby, Target, Trophy } from 'lucide-react'

export default function ProductionInventory() {
  const { state } = useAppStore()

  const { matrizes, bezerros, tip, touros } = useMemo(() => {
    let m = 0,
      b = 0,
      t = 0,
      tr = 0
    state.animais
      .filter((a) => a.status === 'Ativo')
      .forEach((a) => {
        if (a.categoria.includes('Matriz')) m++
        else if (a.categoria.includes('Bezerro') || a.categoria.includes('Bezerra')) b++
        else if (a.categoria.includes('TIP')) t++
        else if (a.categoria.includes('Touro')) tr++
      })
    return { matrizes: m, bezerros: b, tip: t, touros: tr }
  }, [state.animais])

  const reproKPIs = useMemo(() => {
    const repros = state.reproducoes
    const totalDGTouches = repros.filter(
      (r) => r.status === 'Prenhe' || r.status === 'Vazia' || r.status === 'Parida',
    ).length
    const prenhesCount = repros.filter((r) => r.status === 'Prenhe' || r.status === 'Parida').length
    const txConcepcao = totalDGTouches > 0 ? (prenhesCount / totalDGTouches) * 100 : 0

    const bullStats: Record<string, { total: number; prenhe: number }> = {}
    repros.forEach((r) => {
      if (r.touro && (r.status === 'Prenhe' || r.status === 'Vazia' || r.status === 'Parida')) {
        if (!bullStats[r.touro]) bullStats[r.touro] = { total: 0, prenhe: 0 }
        bullStats[r.touro].total++
        if (r.status === 'Prenhe' || r.status === 'Parida') bullStats[r.touro].prenhe++
      }
    })

    const bestBull = Object.entries(bullStats)
      .map(([name, stats]) => ({
        name,
        rate: (stats.prenhe / stats.total) * 100,
        count: stats.total,
      }))
      .sort((a, b) => b.rate - a.rate)[0]

    return { txConcepcao, bestBull }
  }, [state.reproducoes])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-subtle border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Matrizes Ativas</CardTitle>
            <Beef className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-secondary">{matrizes}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-t-4 border-t-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bezerros(as)</CardTitle>
            <Baby className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-secondary">{bezerros}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Rebanho Comercial (TIP)</CardTitle>
            <Target className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-secondary">{tip}</div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-t-4 border-t-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Touros / Reprodutores</CardTitle>
            <Trophy className="w-4 h-4 text-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-secondary">{touros}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-subtle bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900">Taxa de Concepção Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-700">
              {reproKPIs.txConcepcao.toFixed(1)}%
            </div>
            <p className="text-sm text-emerald-800/70 mt-1">
              Prenhez confirmada vs Total de Toques
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-secondary">Ranking de Reprodutores</CardTitle>
          </CardHeader>
          <CardContent>
            {reproKPIs.bestBull ? (
              <div>
                <p className="text-sm text-muted-foreground">Melhor Desempenho (Sêmen/Monta):</p>
                <div className="text-xl font-bold text-primary mt-1">{reproKPIs.bestBull.name}</div>
                <p className="text-sm font-medium text-slate-600">
                  {reproKPIs.bestBull.rate.toFixed(1)}% de sucesso ({reproKPIs.bestBull.count} IAs)
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Dados insuficientes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
