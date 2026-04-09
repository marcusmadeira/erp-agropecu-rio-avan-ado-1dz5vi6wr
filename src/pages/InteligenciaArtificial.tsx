import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Activity, Baby, Dna, Package, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getConversas, askAi, type ConversaIA } from '@/services/conversas_ia'
import { getPesagens } from '@/services/pesagens'
import { getLotes } from '@/services/lotes'
import { getIatfs } from '@/services/manejo_iatf'
import { getNascimentos } from '@/services/nascimentos'
import { getAnimais } from '@/services/animais'
import { getEstoqueSemenList } from '@/services/estoque_semen'
import { getEstoqueInsumos } from '@/services/estoque_insumos'
import { getTransacoesFinanceiras } from '@/services/transacoes_financeiras'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealtime } from '@/hooks/use-realtime'

function ActionCard({ title, description, icon: Icon, loading, onClick, buttonText }: any) {
  return (
    <Card className="border-slate-200 shadow-sm flex flex-col bg-white">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button
          onClick={onClick}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-colors duration-200"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BrainCircuit className="w-4 h-4 mr-2" />
          )}
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function InteligenciaArtificial() {
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const [history, setHistory] = useState<ConversaIA[]>([])
  const { toast } = useToast()

  const loadHistory = async () => {
    try {
      const data = await getConversas()
      setHistory(data.reverse())
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])
  useRealtime('conversas_ia', () => {
    loadHistory()
  })

  const handleAction = async (
    type: string,
    fetchFn: () => Promise<any>,
    buildPrompt: (data: any) => string,
  ) => {
    setLoadingType(type)
    try {
      const data = await fetchFn()
      const prompt = buildPrompt(data)
      await askAi(prompt)
      toast({ title: 'Análise concluída', description: 'Recomendações geradas com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao gerar análise.', variant: 'destructive' })
    } finally {
      setLoadingType(null)
    }
  }

  const dashboardItems = history.filter((h) => h.pergunta.startsWith('['))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-[calc(100vh-4rem)] animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard de Inteligência Artificial
        </h1>
        <p className="text-slate-500 mt-2">
          Análises preditivas e recomendações inteligentes fornecidas pelo ADAPT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          title="Análise de Pesagens"
          description="Ajustes nutricionais baseados em tendências de GMD."
          icon={Activity}
          loading={loadingType === 'weight'}
          onClick={() =>
            handleAction(
              'weight',
              () => Promise.all([getPesagens({ sort: '-data_pesagem' }), getLotes()]),
              ([p, l]) =>
                `[Análise de Pesagens] Sugira ajustes nutricionais específicos para os animais ou lotes, baseados nas tendências do GMD:\nPesagens: ${JSON.stringify(p.slice(0, 15))}\nLotes: ${JSON.stringify(l.slice(0, 10))}`,
            )
          }
          buttonText="Analisar Pesagens"
        />
        <ActionCard
          title="Previsão de DPP"
          description="Cálculo da Data Provável de Parto e padrões."
          icon={Baby}
          loading={loadingType === 'calving'}
          onClick={() =>
            handleAction(
              'calving',
              () =>
                Promise.all([
                  getIatfs({ sort: '-data_iatf' }),
                  getNascimentos({ sort: '-data_nascimento' }),
                ]),
              ([i, n]) =>
                `[Previsão de DPP] Calcule um intervalo de datas provável para os próximos partos (DPP) analisando o status reprodutivo atual e o histórico de gestação:\nIATFs: ${JSON.stringify(i.slice(0, 15))}\nNascimentos: ${JSON.stringify(n.slice(0, 10))}`,
            )
          }
          buttonText="Prever Partos"
        />
        <ActionCard
          title="Recomendação de Acasalamento"
          description="Melhores combinações genéticas (Matriz x Touro)."
          icon={Dna}
          loading={loadingType === 'mating'}
          onClick={() =>
            handleAction(
              'mating',
              () =>
                Promise.all([
                  getAnimais({ filter: 'categoria="Matriz PO" || categoria="Touro PO"' }),
                  getEstoqueSemenList(),
                ]),
              ([a, s]) =>
                `[Recomendação de Acasalamento] Sugira as melhores combinações genéticas entre as matrizes e touros/sêmen disponíveis para melhorar a qualidade do rebanho:\nAnimais: ${JSON.stringify(a.slice(0, 15))}\nSêmen: ${JSON.stringify(s.slice(0, 10))}`,
            )
          }
          buttonText="Sugerir Acasalamentos"
        />
        <ActionCard
          title="Otimização de Insumos"
          description="Custo-benefício de estoque e análise de gastos."
          icon={Package}
          loading={loadingType === 'supply'}
          onClick={() =>
            handleAction(
              'supply',
              () =>
                Promise.all([
                  getEstoqueInsumos(),
                  getTransacoesFinanceiras({ sort: '-data_vencimento' }),
                ]),
              ([i, t]) =>
                `[Otimização de Insumos] Faça uma análise custo-benefício cruzando o estoque com as transações recentes. Sugira quando comprar insumos e identifique gastos excessivos:\nInsumos: ${JSON.stringify(i.slice(0, 15))}\nTransações: ${JSON.stringify(t.slice(0, 15))}`,
            )
          }
          buttonText="Otimizar Insumos"
        />
      </div>

      <div className="pt-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-slate-700" /> Recomendações Recentes
        </h2>

        {loadingType && (
          <Card className="mb-4 animate-pulse bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {dashboardItems.map((item) => {
            const match = item.pergunta.match(/^\[(.*?)\]/)
            return (
              <Card key={item.id} className="border-slate-200 shadow-sm bg-white animate-fade-in">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {match ? match[1] : 'Recomendação'}
                    </CardTitle>
                    <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                      {format(new Date(item.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {item.resposta}
                </CardContent>
              </Card>
            )
          })}

          {dashboardItems.length === 0 && !loadingType && (
            <div className="text-center py-12 px-4 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed animate-fade-in">
              <BrainCircuit className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-lg font-medium text-slate-600">
                Nenhuma recomendação gerada ainda.
              </p>
              <p className="text-sm mt-1">
                Use os cartões acima para iniciar uma análise com o ADAPT.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
