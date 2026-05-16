import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SimuladorTab } from './components/SimuladorTab'
import { ComparativoTab } from './components/ComparativoTab'
import { HistoricoTab } from './components/HistoricoTab'
import { Link } from 'react-router-dom'
import { Calculator, Info, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'

export default function SimuladorCenarios() {
  const [hasPrefill, setHasPrefill] = useState(false)
  const [mercadoData, setMercadoData] = useState<{ preco: number; data: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMercado = async () => {
      try {
        const precos = await pb
          .collection('precos_mercado')
          .getList(1, 1, { sort: '-data_registro' })
        if (precos.items.length > 0) {
          setMercadoData({
            preco: precos.items[0].preco_arroba,
            data: new Date(precos.items[0].data_registro).toLocaleDateString('pt-BR'),
          })
        }
      } catch {
        /* intentionally ignored */
      } finally {
        setLoading(false)
      }
    }
    loadMercado()

    const prefill = localStorage.getItem('SIMULADOR_PREFILL')
    if (prefill) {
      setHasPrefill(true)
    }
  }, [])

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#094016]/10 rounded-lg">
          <Calculator className="w-6 h-6 text-[#094016]" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Simulador de Cenários
            </h1>
            {mercadoData && (
              <span className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 bg-white shadow-sm">
                Mercado Ref: R$ {mercadoData.preco.toFixed(2)} ({mercadoData.data})
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">Viabilidade econômica de TIP e Confinamento</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Carregando...</div>
      ) : !mercadoData || mercadoData.preco === 0 ? (
        <Alert className="bg-rose-50 border-rose-200 text-rose-800">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="font-semibold text-rose-900">
            Acesso Bloqueado: Realize a carga inicial do preço da arroba no Setup Inicial.
          </AlertTitle>
          <AlertDescription>
            <Link to="/admin/setup-inicial" className="underline font-medium hover:text-rose-900">
              Ir para o Setup Inicial
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {hasPrefill && (
            <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800 mb-6">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertTitle className="font-semibold text-indigo-900">Dados Integrados</AlertTitle>
              <AlertDescription>
                Dados carregados do Semáforo de Ponto Ótimo de Venda. Os valores foram
                pré-preenchidos no simulador.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="simulador" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="simulador">Simulador Interativo</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
              <TabsTrigger value="historico">Histórico & Auditoria</TabsTrigger>
            </TabsList>
            <TabsContent value="simulador">
              <SimuladorTab />
            </TabsContent>
            <TabsContent value="comparativo">
              <ComparativoTab />
            </TabsContent>
            <TabsContent value="historico">
              <HistoricoTab />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
