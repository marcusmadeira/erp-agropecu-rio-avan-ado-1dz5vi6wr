import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react'

export function AnimalKPIs({ animal, pesagens }: { animal: any; pesagens: any[] }) {
  const kpis = useMemo(() => {
    const custo = animal.custo_variavel_acumulado || 0
    const receitaEstimada = (animal.peso_atual_kg / 30) * 300 // assume 300 BRL/arroba
    const lucro = receitaEstimada - custo
    const roi = custo > 0 ? (lucro / custo) * 100 : 0

    let gmd = 0
    if (pesagens.length > 1) {
      const sorted = [...pesagens].sort(
        (a, b) => new Date(a.data_pesagem).getTime() - new Date(b.data_pesagem).getTime(),
      )
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const days =
        (new Date(last.data_pesagem).getTime() - new Date(first.data_pesagem).getTime()) /
        (1000 * 3600 * 24)
      if (days > 0) gmd = (last.peso_kg - first.peso_kg) / days
    }

    const recommendDescarte = roi < 10 || gmd < 0.5

    return { custo, receitaEstimada, lucro, roi, gmd, recommendDescarte }
  }, [animal, pesagens])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Custo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">R$ {kpis.custo.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Estimada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {kpis.receitaEstimada.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Lucro Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#094016]">R$ {kpis.lucro.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">ROI (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.roi.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Desempenho Genético
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Pai</p>
              <p className="font-medium">
                {animal.expand?.pai_id?.nome ||
                  animal.expand?.pai_id?.id_manejo_brinco ||
                  animal.genealogia_pai ||
                  'Desconhecido'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Mãe</p>
              <p className="font-medium">
                {animal.expand?.mae_id?.nome ||
                  animal.expand?.mae_id?.id_manejo_brinco ||
                  animal.genealogia_mae ||
                  'Desconhecida'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">GMD Médio Global (kg/dia)</p>
              <p className="font-medium text-lg">{kpis.gmd.toFixed(3)}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            kpis.recommendDescarte ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {kpis.recommendDescarte ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
              Análise & Recomendação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-slate-700">
              Com base no histórico de ganho de peso (GMD {kpis.gmd.toFixed(2)} kg/dia) e
              rentabilidade atual (ROI {kpis.roi.toFixed(1)}%), o sistema sugere a seguinte ação:
            </p>
            {kpis.recommendDescarte ? (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 text-sm py-1 px-3 shadow-sm"
              >
                Considerar Descarte ou Reclassificação
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-300 text-sm py-1 px-3 shadow-sm"
              >
                Manter no Lote Atual (Bom Desempenho)
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
