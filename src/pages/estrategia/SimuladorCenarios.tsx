import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SimuladorTab } from './components/SimuladorTab'
import { ComparativoTab } from './components/ComparativoTab'
import { HistoricoTab } from './components/HistoricoTab'
import { Calculator, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SimuladorCenarios() {
  const [hasPrefill, setHasPrefill] = useState(false)

  useEffect(() => {
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Simulador de Cenários
          </h1>
          <p className="text-slate-500 mt-1">Viabilidade econômica de TIP e Confinamento</p>
        </div>
      </div>

      {hasPrefill && (
        <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800">
          <Info className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="font-semibold text-indigo-900">Dados Integrados</AlertTitle>
          <AlertDescription>
            Dados carregados do Semáforo de Ponto Ótimo de Venda. Os valores foram pré-preenchidos
            no simulador.
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
    </div>
  )
}
