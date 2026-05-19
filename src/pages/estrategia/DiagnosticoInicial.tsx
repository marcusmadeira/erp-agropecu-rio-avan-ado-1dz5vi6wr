import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createDiagnostico, getDiagnosticos } from '@/services/diagnostico'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Target,
  DollarSign,
  Scale,
  Activity,
  Map as MapIcon,
  Loader2,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

interface Diagnostico {
  id: string
  tamanho_ha: number
  total_animais: number
  arrobas_produzidas: number
  custos: number
  receitas: number
  custo_arroba: number
  lotacao: number
  produtividade_ha: number
  margem_lucro: number
  roi: number
  created: string
}

export default function DiagnosticoInicial() {
  const [historico, setHistorico] = useState<Diagnostico[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [realtimeData, setRealtimeData] = useState({
    tamanho_ha: 0,
    total_animais: 0,
    arrobas_produzidas: 0,
    custos: 0,
    receitas: 0,
    custo_arroba: 0,
    lotacao: 0,
    produtividade_ha: 0,
    margem_lucro: 0,
    roi: 0,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const hist = await getDiagnosticos()
      setHistorico(hist as Diagnostico[])

      // Real-time calculation using shared services
      const { getActiveHerdMetrics } = await import('@/services/herdService')
      const { getConsolidatedFinancials } = await import('@/services/financeService')

      const [herdMetrics, finData, pastos] = await Promise.all([
        getActiveHerdMetrics(),
        getConsolidatedFinancials(),
        pb.collection('pastos_e_piquetes').getFullList(),
      ])

      const total_animais = herdMetrics.animais_ativos
      const arrobas_produzidas = herdMetrics.total_arrobas

      const custos = finData.realizedExpenses
      const receitas = finData.realizedRevenue

      const tamanho_ha = pastos.reduce((acc, p) => acc + (p.area_hectares || 0), 0) || 1

      const custo_arroba = arrobas_produzidas > 0 ? custos / arrobas_produzidas : 0
      const lotacao = total_animais / tamanho_ha
      const produtividade_ha = arrobas_produzidas / tamanho_ha
      const margem_lucro = finData.margin
      const roi = custos > 0 ? ((receitas - custos) / custos) * 100 : 0

      setRealtimeData({
        tamanho_ha,
        total_animais,
        arrobas_produzidas,
        custos,
        receitas,
        custo_arroba,
        lotacao,
        produtividade_ha,
        margem_lucro,
        roi,
      })
    } catch (err: any) {
      toast({
        title: 'Erro de Comunicação',
        description: 'Não foi possível carregar os dados em tempo real.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('animais', () => loadData())
  useRealtime('transacoes_financeiras', () => loadData())
  useRealtime('despesas', () => loadData())
  useRealtime('boletos', () => loadData())

  const handleSaveSnapshot = async () => {
    setSaving(true)
    try {
      const payload = {
        usuario_id: user?.id,
        ...realtimeData,
      }
      await createDiagnostico(payload)
      toast({ title: 'Sucesso', description: 'Diagnóstico salvo com sucesso!' })
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao salvar diagnóstico.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const renderBenchmark = (
    label: string,
    actual: number,
    benchmark: number,
    isHigherBetter: boolean,
    unit: string,
  ) => {
    const isGood = isHigherBetter ? actual >= benchmark : actual <= benchmark
    const color = isGood ? 'text-green-600' : 'text-red-600'
    const Icon = isGood ? CheckCircle2 : AlertCircle

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className={`text-2xl font-bold ${color}`}>
              {actual.toFixed(2)} {unit}
            </h4>
            <span className="text-sm text-muted-foreground">
              / Ref: {benchmark} {unit}
            </span>
          </div>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#094016]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#094016]">Diagnóstico Inicial</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real e visão estratégica da fazenda.
          </p>
        </div>
        <Target className="w-10 h-10 text-[#094016] opacity-80" />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard em Tempo Real</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Snapshots</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Animais Ativos</p>
                  <p className="text-2xl font-bold">{realtimeData.total_animais}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500 opacity-50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Arrobas</p>
                  <p className="text-2xl font-bold">
                    {realtimeData.arrobas_produzidas.toFixed(1)} @
                  </p>
                </div>
                <Scale className="w-8 h-8 text-amber-500 opacity-50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Área Total</p>
                  <p className="text-2xl font-bold">{realtimeData.tamanho_ha.toFixed(1)} ha</p>
                </div>
                <MapIcon className="w-8 h-8 text-emerald-500 opacity-50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ROI Global</p>
                  <p className="text-2xl font-bold text-[#094016]">
                    {realtimeData.roi.toFixed(2)}%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#094016] opacity-50" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Análise & Benchmarking</h2>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Cálculo em Tempo Real</AlertTitle>
              <AlertDescription>
                Este painel reflete o estado atual dos registros no sistema. Valores de referência
                baseados no Top 10% de eficiência.
              </AlertDescription>
            </Alert>

            {realtimeData.total_animais === 0 ? (
              <div className="p-8 border rounded-lg bg-card text-center">
                <p className="text-muted-foreground">
                  Não há animais ativos registrados no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBenchmark('Custo por @', realtimeData.custo_arroba, 220, false, 'R$/@')}
                {renderBenchmark('Lotação', realtimeData.lotacao, 1.5, true, 'UA/ha')}
                {renderBenchmark('Produtividade', realtimeData.produtividade_ha, 15, true, '@/ha')}
                {renderBenchmark('Margem de Lucro', realtimeData.margem_lucro, 20, true, '%')}
                {renderBenchmark('ROI', realtimeData.roi, 15, true, '%')}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveSnapshot}
                disabled={saving}
                className="bg-[#094016] hover:bg-[#094016]/90"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Snapshot Atual
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum diagnóstico registrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {historico.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{new Date(h.created).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          ROI: {h.roi.toFixed(2)}% | Produtividade: {h.produtividade_ha.toFixed(2)}{' '}
                          @/ha
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Custo @: R$ {h.custo_arroba.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Margem: {h.margem_lucro.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
