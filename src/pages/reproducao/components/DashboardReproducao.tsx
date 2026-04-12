import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Percent, Trophy, TrendingUp } from 'lucide-react'
import { getIatfs, getRegistrosNascimento } from '@/services/reproducao'

export default function DashboardReproducao() {
  const [iatfs, setIatfs] = useState<any[]>([])
  const [nascimentos, setNascimentos] = useState<any[]>([])

  useEffect(() => {
    getIatfs()
      .then(setIatfs)
      .catch((e) => {
        console.error(e)
      })
    getRegistrosNascimento()
      .then(setNascimentos)
      .catch((e) => {
        console.error(e)
      })
  }, [])

  const totalInseminadas = iatfs.length
  const totalPrenhes = iatfs.filter((i) => i.resultado_dg === 'Prenhe').length
  const taxaPrenhez = totalInseminadas > 0 ? (totalPrenhes / totalInseminadas) * 100 : 0

  const ranking = iatfs
    .filter((i) => i.resultado_dg === 'Prenhe' && i.expand?.touro_utilizado_id)
    .reduce(
      (acc, curr) => {
        const name = curr.expand.touro_utilizado_id.id_manejo_brinco
        acc[name] = (acc[name] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  const topTouro = Object.entries(ranking).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inseminações</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{totalInseminadas}</div>
          <p className="text-xs text-muted-foreground mt-1">Registros de IATF</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Matrizes Prenhes</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{totalPrenhes}</div>
          <p className="text-xs text-muted-foreground mt-1">Prenhez confirmada</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Prenhez</CardTitle>
          <Percent className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{taxaPrenhez.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Sucesso sobre total</p>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Melhor Touro</CardTitle>
          <Trophy className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-slate-800">{topTouro ? topTouro[0] : '-'}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {topTouro ? `${topTouro[1]} prenhezes` : 'Sem dados suficientes'}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-l-4 border-l-pink-500 col-span-full md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Nascimentos</CardTitle>
          <Activity className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{nascimentos.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Registrados no sistema</p>
        </CardContent>
      </Card>
    </div>
  )
}
