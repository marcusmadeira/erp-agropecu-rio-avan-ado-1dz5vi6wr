import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getBoletosCompletos,
  getHistoricoCobrancas,
  obterInadimplencia,
} from '@/services/financeiro_recebimentos'
import ListagemBoletos from './recebimentos/ListagemBoletos'
import PainelInadimplencia from './recebimentos/PainelInadimplencia'
import ReguaCobranca from './recebimentos/ReguaCobranca'
import PrevisaoBenchmarking from './recebimentos/PrevisaoBenchmarking'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function RecebimentoBoletos() {
  const [boletos, setBoletos] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [bol, hist, met] = await Promise.all([
        getBoletosCompletos(),
        getHistoricoCobrancas(),
        obterInadimplencia(),
      ])
      setBoletos(bol)
      setHistorico(hist)
      if (met) setMetrics(met)
    } catch (err) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('boletos', () => loadData())
  useRealtime('historico_cobrancas', () => loadData())
  useRealtime('parcelas_venda', () => loadData())

  if (loading && !boletos.length) return <div className="p-8">Carregando...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#094016]">Controle de Recebimento</h1>
        <p className="text-muted-foreground">
          Gestão centralizada de recebíveis, inadimplência e previsão de fluxo de caixa.
        </p>
      </div>

      <Tabs defaultValue="listagem" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full h-auto gap-2 bg-transparent">
          <TabsTrigger
            value="listagem"
            className="py-2 bg-white data-[state=active]:bg-[#094016] data-[state=active]:text-white shadow-sm border"
          >
            Listagem e Gestão
          </TabsTrigger>
          <TabsTrigger
            value="inadimplencia"
            className="py-2 bg-white data-[state=active]:bg-[#094016] data-[state=active]:text-white shadow-sm border"
          >
            Inadimplência
          </TabsTrigger>
          <TabsTrigger
            value="regua"
            className="py-2 bg-white data-[state=active]:bg-[#094016] data-[state=active]:text-white shadow-sm border"
          >
            Régua de Cobrança
          </TabsTrigger>
          <TabsTrigger
            value="previsao"
            className="py-2 bg-white data-[state=active]:bg-[#094016] data-[state=active]:text-white shadow-sm border"
          >
            Previsão & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listagem">
          <ListagemBoletos boletos={boletos} onRefresh={loadData} />
        </TabsContent>
        <TabsContent value="inadimplencia">
          <PainelInadimplencia boletos={boletos} externalMetrics={metrics} />
        </TabsContent>
        <TabsContent value="regua">
          <ReguaCobranca historico={historico} boletos={boletos} />
        </TabsContent>
        <TabsContent value="previsao">
          <PrevisaoBenchmarking boletos={boletos} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
