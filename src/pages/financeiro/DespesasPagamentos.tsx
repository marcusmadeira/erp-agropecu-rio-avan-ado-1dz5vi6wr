import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DashboardDespesas from './components/DashboardDespesas'
import DespesasList from './components/DespesasList'
import BoletosPagarList from './components/BoletosPagarList'
import PagamentosList from './components/PagamentosList'

export default function DespesasPagamentos() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#094016]">
          Gestão de Despesas e Pagamentos
        </h1>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="boletos">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <DashboardDespesas />
        </TabsContent>
        <TabsContent value="despesas" className="space-y-4 mt-4">
          <DespesasList />
        </TabsContent>
        <TabsContent value="boletos" className="space-y-4 mt-4">
          <BoletosPagarList />
        </TabsContent>
        <TabsContent value="pagamentos" className="space-y-4 mt-4">
          <PagamentosList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
