import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FinanceiroReport from './relatorios/FinanceiroReport'
import DesempenhoReport from './relatorios/DesempenhoReport'
import ReproducaoReport from './relatorios/ReproducaoReport'
import { FileBarChart } from 'lucide-react'

export default function Relatorios() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <FileBarChart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Relatórios Gerenciais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise consolidada de produtividade e saúde financeira.
          </p>
        </div>
      </div>

      <Tabs defaultValue="financeiro" className="w-full space-y-6">
        <TabsList className="bg-white border border-slate-200 shadow-sm p-1 h-auto grid grid-cols-3 w-full max-w-xl rounded-lg">
          <TabsTrigger
            value="financeiro"
            className="py-2.5 rounded-md font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="desempenho"
            className="py-2.5 rounded-md font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Desempenho
          </TabsTrigger>
          <TabsTrigger
            value="reproducao"
            className="py-2.5 rounded-md font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Reprodução
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="focus:outline-none mt-4">
          <FinanceiroReport />
        </TabsContent>
        <TabsContent value="desempenho" className="focus:outline-none mt-4">
          <DesempenhoReport />
        </TabsContent>
        <TabsContent value="reproducao" className="focus:outline-none mt-4">
          <ReproducaoReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
