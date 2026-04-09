import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TransacoesTab from './financeiro/TransacoesTab'

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">Financeiro</h1>
      <p className="text-muted-foreground text-lg">
        Gestão financeira: DRE, Fluxo de Caixa e Transações.
      </p>

      <Tabs defaultValue="transacoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="dre" disabled>
            DRE
          </TabsTrigger>
          <TabsTrigger value="fluxo" disabled>
            Fluxo de Caixa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transacoes">
          <TransacoesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
