import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TabEventos from './components/TabEventos'
import TabVendas from './components/TabVendas'
import TabBoletos from './components/TabBoletos'
import TabOperacoes from './components/TabOperacoes'
import TabClientesCRM from './components/TabClientesCRM'

export default function GestaoVendas() {
  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Gestão de Vendas</h1>
        <p className="text-gray-600 mt-1">
          Acompanhe eventos, vendas e cobranças do rebanho em um só lugar.
        </p>
      </div>

      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-md mb-6 w-full sm:w-auto inline-flex shadow-sm">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white font-medium px-6 py-2 text-gray-700 transition-colors"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="eventos"
            className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white font-medium px-6 py-2 text-gray-700 transition-colors"
          >
            Eventos & Lotes
          </TabsTrigger>
          <TabsTrigger
            value="vendas"
            className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white font-medium px-6 py-2 text-gray-700 transition-colors"
          >
            Operações de Venda
          </TabsTrigger>
          <TabsTrigger
            value="boletos"
            className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white font-medium px-6 py-2 text-gray-700 transition-colors"
          >
            Cobranças & Recebimentos
          </TabsTrigger>
          <TabsTrigger
            value="clientes"
            className="data-[state=active]:bg-emerald-800 data-[state=active]:text-white font-medium px-6 py-2 text-gray-700 transition-colors"
          >
            Clientes CRM
          </TabsTrigger>
        </TabsList>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[500px]">
          <TabsContent value="dashboard" className="mt-0">
            <TabVendas />
          </TabsContent>
          <TabsContent value="eventos" className="mt-0">
            <TabEventos />
          </TabsContent>
          <TabsContent value="vendas" className="mt-0">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Operações de Venda</h2>
            </div>
            <TabOperacoes />
          </TabsContent>
          <TabsContent value="boletos" className="mt-0">
            <TabBoletos />
          </TabsContent>
          <TabsContent value="clientes" className="mt-0">
            <TabClientesCRM />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
