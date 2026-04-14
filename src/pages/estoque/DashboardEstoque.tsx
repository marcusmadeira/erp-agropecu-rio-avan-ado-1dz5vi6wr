import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PackageSearch, Activity, ClipboardList, Database } from 'lucide-react'
import { VisaoGeralEstoque } from './components/VisaoGeralEstoque'
import { HistoricoEstoque } from './components/HistoricoEstoque'
import { ConsumoLotes } from './components/ConsumoLotes'

export default function DashboardEstoque() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Database className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard de Estoque</h1>
          <p className="text-slate-500 mt-1">Gestão inteligente de insumos e consumo</p>
        </div>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="mb-4 bg-white/50 border backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Histórico de Movimentações
          </TabsTrigger>
          <TabsTrigger value="consumo-lote" className="flex items-center gap-2">
            <PackageSearch className="w-4 h-4" /> Consumo por Lote
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral">
          <VisaoGeralEstoque />
        </TabsContent>
        <TabsContent value="historico">
          <HistoricoEstoque />
        </TabsContent>
        <TabsContent value="consumo-lote">
          <ConsumoLotes />
        </TabsContent>
      </Tabs>
    </div>
  )
}
