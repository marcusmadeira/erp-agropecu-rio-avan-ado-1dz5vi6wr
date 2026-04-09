import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlanejamentoTab from './components/PlanejamentoTab'
import IatfTab from './components/IatfTab'
import NascimentosTab from './components/NascimentosTab'
import { getAnimais } from '@/services/reproducao'

export default function Reproducao() {
  const [animais, setAnimais] = useState<any[]>([])

  useEffect(() => {
    getAnimais()
      .then(setAnimais)
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary">Reprodução</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Gerencie planejamento, IATF e nascimentos do seu rebanho.
        </p>
      </div>

      <Tabs defaultValue="planejamento" className="w-full">
        <TabsList className="bg-slate-200/50 p-1 rounded-lg">
          <TabsTrigger
            value="planejamento"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-6"
          >
            Planejamento
          </TabsTrigger>
          <TabsTrigger
            value="iatf"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-6"
          >
            IATF
          </TabsTrigger>
          <TabsTrigger
            value="nascimentos"
            className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold rounded-md px-6"
          >
            Nascimentos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planejamento" className="mt-6">
          <PlanejamentoTab animais={animais} />
        </TabsContent>
        <TabsContent value="iatf" className="mt-6">
          <IatfTab animais={animais} />
        </TabsContent>
        <TabsContent value="nascimentos" className="mt-6">
          <NascimentosTab animais={animais} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
