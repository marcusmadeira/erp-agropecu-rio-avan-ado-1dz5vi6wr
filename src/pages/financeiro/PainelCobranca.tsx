import { useEffect, useState, useMemo } from 'react'
import { getPainelCobrancaData } from '@/services/cobrancas'
import { PainelGrupo } from '@/components/cobrancas/PainelGrupo'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { differenceInDays, startOfDay, isValid } from 'date-fns'

function getGrupoKey(vencimento: string) {
  const dt = startOfDay(new Date(vencimento))
  if (!isValid(dt)) return 'outros'
  const diff = differenceInDays(dt, startOfDay(new Date()))

  if (diff === 0) return 'vencendoHoje'
  if (diff === 1) return 'vencendo1Dia'
  if (diff === 2) return 'vencendo2Dias'
  if (diff === -1) return 'vencidas1Dia'
  if (diff <= -2) return 'vencidas2Mais'
  return 'outros'
}

import { Card, CardContent } from '@/components/ui/card'

export default function PainelCobranca() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    dashboard: any
    parcelas: any[]
    itens: any[]
    historicos: any[]
  }>({
    dashboard: { recebido: 0, aReceber: 0, vencido: 0, vencendo7Dias: 0 },
    parcelas: [],
    itens: [],
    historicos: [],
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPainelCobrancaData()
      setData(res)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {
      vencendoHoje: [],
      vencendo1Dia: [],
      vencendo2Dias: [],
      vencidas1Dia: [],
      vencidas2Mais: [],
      outros: [],
    }
    data.parcelas.forEach((p) => {
      const key = getGrupoKey(p.data_vencimento)
      if (groups[key]) groups[key].push(p)
      else groups.outros.push(p)
    })
    return groups
  }, [data.parcelas])

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel de Cobrança</h1>
          <p className="text-gray-500 mt-1">Gerenciamento manual de recebimentos e contatos.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-sm text-gray-500 font-medium">Recebido</p>
              <p className="text-2xl font-bold text-emerald-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  data.dashboard.recebido,
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-sm text-gray-500 font-medium">A Receber</p>
              <p className="text-2xl font-bold text-blue-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  data.dashboard.aReceber,
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-sm text-gray-500 font-medium">Vencido</p>
              <p className="text-2xl font-bold text-red-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  data.dashboard.vencido,
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-400 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-sm text-gray-500 font-medium">Vencendo em 7 dias</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  data.dashboard.vencendo7Dias,
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <PainelGrupo
            title="Vencidas há 2 dias ou mais"
            colorClass="bg-red-100 text-red-800"
            parcelas={grouped.vencidas2Mais}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />
          <PainelGrupo
            title="Vencidas há 1 dia"
            colorClass="bg-orange-100 text-orange-800"
            parcelas={grouped.vencidas1Dia}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />
          <PainelGrupo
            title="Vencendo Hoje"
            colorClass="bg-yellow-100 text-yellow-800"
            parcelas={grouped.vencendoHoje}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />
          <PainelGrupo
            title="Vencendo em 1 dia"
            colorClass="bg-blue-100 text-blue-800"
            parcelas={grouped.vencendo1Dia}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />
          <PainelGrupo
            title="Vencendo em 2 dias"
            colorClass="bg-indigo-100 text-indigo-800"
            parcelas={grouped.vencendo2Dias}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />
          <PainelGrupo
            title="Futuras (Outros)"
            colorClass="bg-gray-100 text-gray-800"
            parcelas={grouped.outros}
            itens={data.itens}
            historicos={data.historicos}
            onRefresh={loadData}
          />

          {data.parcelas.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500 text-lg">
                Não há parcelas pendentes ou atrasadas no momento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
