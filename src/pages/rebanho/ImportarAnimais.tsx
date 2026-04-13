import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImportarAnimaisTab from '@/components/importacao/ImportarAnimaisTab'
import ImportarClientesTab from '@/components/importacao/ImportarClientesTab'

export default function ImportacaoGeral() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-6xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#094016]">Central de Importação</h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Importe dados para o sistema usando planilhas ou documentos (PDF, Excel, CSV).
        </p>
      </div>

      <Tabs defaultValue="clientes" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 p-1 rounded-xl">
          <TabsTrigger
            value="clientes"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#094016] data-[state=active]:shadow-sm"
          >
            Parceiros / Clientes
          </TabsTrigger>
          <TabsTrigger
            value="animais"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#094016] data-[state=active]:shadow-sm"
          >
            Animais
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clientes" className="mt-8 animate-fade-in-up">
          <ImportarClientesTab />
        </TabsContent>
        <TabsContent value="animais" className="mt-8 animate-fade-in-up">
          <ImportarAnimaisTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
