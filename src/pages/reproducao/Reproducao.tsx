import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DashboardReproducao from './components/DashboardReproducao'
import EstacaoMontaTab from './components/EstacaoMontaTab'
import PlanejamentoTab from './components/PlanejamentoTab'
import IatfTab from './components/IatfTab'
import SemaforoTab from './components/SemaforoTab'
import NascimentosTab from './components/NascimentosTab'
import { getAnimais, getAnimaisFemeas, getAnimaisTouros, getLotes } from '@/services/reproducao'

export default function Reproducao() {
  const [animais, setAnimais] = useState<any[]>([])
  const [femeas, setFemeas] = useState<any[]>([])
  const [touros, setTouros] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])

  useEffect(() => {
    Promise.all([getAnimais(), getAnimaisFemeas(), getAnimaisTouros(), getLotes()])
      .then(([a, f, t, l]) => {
        setAnimais(a)
        setFemeas(f)
        setTouros(t)
        setLotes(l)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-primary">Reprodução & Estação de Monta</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Planeje, execute e monitore o ciclo reprodutivo do seu rebanho com eficiência.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-slate-200/50 p-1 rounded-lg flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="estacao"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Estação & Repasse
          </TabsTrigger>
          <TabsTrigger
            value="planejamento"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Planejamento
          </TabsTrigger>
          <TabsTrigger
            value="iatf"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            IATF & DG
          </TabsTrigger>
          <TabsTrigger
            value="semaforo"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Semáforo
          </TabsTrigger>
          <TabsTrigger
            value="nascimentos"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Nascimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardReproducao />
        </TabsContent>
        <TabsContent value="estacao" className="mt-6">
          <EstacaoMontaTab touros={touros} lotes={lotes} />
        </TabsContent>
        <TabsContent value="planejamento" className="mt-6">
          <PlanejamentoTab femeas={femeas} touros={touros} />
        </TabsContent>
        <TabsContent value="iatf" className="mt-6">
          <IatfTab femeas={femeas} touros={touros} />
        </TabsContent>
        <TabsContent value="semaforo" className="mt-6">
          <SemaforoTab />
        </TabsContent>
        <TabsContent value="nascimentos" className="mt-6">
          <NascimentosTab femeas={femeas} animais={animais} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
