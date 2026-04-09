import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ParceirosTab from './cadastros/ParceirosTab'
import AnimaisTab from './cadastros/AnimaisTab'
import LotesTab from './cadastros/LotesTab'

export default function Cadastros() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Cadastros</h1>
        <p className="text-muted-foreground text-lg">
          Gerenciamento de Parceiros, Animais e Lotes.
        </p>
      </div>

      <Tabs defaultValue="parceiros" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
          <TabsTrigger value="animais">Animais</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
        </TabsList>
        <TabsContent value="parceiros" className="mt-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
            <ParceirosTab />
          </div>
        </TabsContent>
        <TabsContent value="animais" className="mt-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
            <AnimaisTab />
          </div>
        </TabsContent>
        <TabsContent value="lotes" className="mt-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
            <LotesTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
