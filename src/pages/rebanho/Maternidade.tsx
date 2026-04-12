import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaternidadeNascimentos } from './components/maternidade/MaternidadeNascimentos'
import { MaternidadeDestinacao } from './components/maternidade/MaternidadeDestinacao'

export default function Maternidade() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-[#094016]">Maternidade e Destinação de Bezerros</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Gerencie nascimentos, status RGN e o fluxo de destinação de bezerros do rebanho.
        </p>
      </div>
      <Tabs defaultValue="nascimentos" className="w-full">
        <TabsList className="bg-slate-200/50 p-1 rounded-lg flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="nascimentos"
            className="data-[state=active]:bg-[#094016] data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Gestão de Nascimentos
          </TabsTrigger>
          <TabsTrigger
            value="destinacao"
            className="data-[state=active]:bg-[#094016] data-[state=active]:text-white font-bold rounded-md px-4"
          >
            Destinação de Bezerros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nascimentos" className="mt-6">
          <MaternidadeNascimentos />
        </TabsContent>

        <TabsContent value="destinacao" className="mt-6">
          <MaternidadeDestinacao />
        </TabsContent>
      </Tabs>
    </div>
  )
}
