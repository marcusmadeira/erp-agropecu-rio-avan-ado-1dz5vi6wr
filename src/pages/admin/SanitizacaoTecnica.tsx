import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Database,
  ShieldAlert,
  Link as LinkIcon,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function SanitizacaoTecnica() {
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [report, setReport] = useState<any>(null)
  const { toast } = useToast()

  const runAudit = async () => {
    setLoading(true)
    try {
      // 1. Data Localization & Links
      const animais = await pb
        .collection('animais')
        .getFullList({ filter: 'status!="Vendido" && status!="Morto"' })
      const animaisSemLote = animais.filter((a) => !a.lote_atual_id)

      const lotes = await pb.collection('lotes').getFullList()
      const lotesAtivos = lotes.filter((l) => l.status === 'Ativo')
      const lotesSemCC = lotesAtivos.filter((l) => !l.centro_custo)

      const transacoes = await pb.collection('transacoes_financeiras').getFullList()
      const transacoesSemCC = transacoes.filter((t) => !t.centro_custo)
      const transacoesSemParceiro = transacoes.filter((t) => !t.parceiro_id)

      const pesagensOrfas = await pb
        .collection('pesagens_diarias')
        .getFullList({ filter: 'animal_id = ""' })
      const tratosOrfaos = await pb
        .collection('trato_diario_lotes')
        .getFullList({ filter: 'lote_id = "" || formulacao_id = ""' })

      // 3. Inventory
      const estoque = await pb.collection('estoque_insumos').getFullList()
      const estoqueNegativo = estoque.filter((e) => e.quantidade_atual < 0)

      const names = estoque.map((e) => e.produto.toLowerCase().trim())
      const duplicates = names.filter((item, index) => names.indexOf(item) !== index)
      const estoqueDuplicados = estoque.filter((e) =>
        duplicates.includes(e.produto.toLowerCase().trim()),
      )

      // 5. Arroba Reference
      const precos = await pb.collection('precos_mercado').getList(1, 1, { sort: '-data_registro' })
      const hasPreco = precos.items.length > 0 && precos.items[0].preco_arroba > 0

      // 6. Ops pass
      const d48 = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      const errosLogs = await pb
        .collection('logs_sistema')
        .getFullList({ filter: `created >= '${d48}' && status_evento = 'Falha'` })

      // Checklists
      const dataLocalizationPass =
        animaisSemLote.length === 0 &&
        transacoesSemParceiro.length === 0 &&
        pesagensOrfas.length === 0 &&
        tratosOrfaos.length === 0
      const linksFixedPass = animaisSemLote.length === 0 && lotesSemCC.length === 0
      const inventoryPass = estoqueNegativo.length === 0 && estoqueDuplicados.length === 0
      const costCenterPass = lotesSemCC.length === 0
      const arrobaPass = hasPreco
      const opsPass = errosLogs.length === 0

      const allPass =
        dataLocalizationPass &&
        linksFixedPass &&
        inventoryPass &&
        costCenterPass &&
        arrobaPass &&
        opsPass

      setReport({
        animaisSemLote,
        lotesSemCC,
        transacoesSemCC,
        transacoesSemParceiro,
        pesagensOrfas,
        tratosOrfaos,
        estoqueNegativo,
        estoqueDuplicados,
        errosLogs,
        hasPreco,
        dataLocalizationPass,
        linksFixedPass,
        inventoryPass,
        costCenterPass,
        arrobaPass,
        opsPass,
        allPass,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro na auditoria',
        description: 'Não foi possível completar a varredura técnica.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAudit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFixLotesCC = async () => {
    if (!report?.lotesSemCC?.length) return
    try {
      setFixing(true)
      for (const lote of report.lotesSemCC) {
        await pb.collection('lotes').update(lote.id, { centro_custo: 'CC02-Comercial TIP' })
      }
      toast({
        title: 'Lotes atualizados',
        description:
          'Centro de custo padrão aplicado com sucesso a todos os lotes ativos sem classificação.',
      })
      await runAudit()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao aplicar correção em lote.',
        variant: 'destructive',
      })
    } finally {
      setFixing(false)
    }
  }

  const ChecklistItem = ({
    title,
    passed,
    fails,
    gravity,
  }: {
    title: string
    passed: boolean
    fails: string
    gravity: string
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm mb-3">
      <div className="flex items-center gap-3">
        {passed ? (
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        ) : (
          <XCircle className="w-6 h-6 text-rose-500" />
        )}
        <div>
          <h4 className="font-semibold text-slate-800">{title}</h4>
          {!passed && <p className="text-sm text-slate-500 mt-0.5">{fails}</p>}
        </div>
      </div>
      {!passed && (
        <Badge
          variant="outline"
          className={
            gravity === 'Alta'
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-amber-700 bg-amber-50 border-amber-200'
          }
        >
          Impacto: {gravity}
        </Badge>
      )}
    </div>
  )

  if (loading && !report) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <Database className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sanitização e Auditoria Técnica</h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Verificação de integridade de dados e conformidade para liberação
            </p>
          </div>
        </div>
        <Button onClick={runAudit} disabled={loading} variant="outline" className="text-slate-900">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Re-processar Auditoria
        </Button>
      </div>

      {report && (
        <div
          className={`p-6 rounded-xl border-2 mb-8 ${report.allPass ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}
        >
          <div className="flex items-center gap-4 mb-2">
            {report.allPass ? (
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            )}
            <h2
              className={`text-2xl font-bold ${report.allPass ? 'text-emerald-900' : 'text-rose-900'}`}
            >
              {report.allPass ? 'LIBERAÇÃO AMPLA AUTORIZADA' : 'LIBERAÇÃO AMPLA NÃO AUTORIZADA'}
            </h2>
          </div>
          <p
            className={`text-lg font-medium ${report.allPass ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            {report.allPass
              ? 'O sistema atende a todos os critérios de confiabilidade e consistência relacional.'
              : 'Pendências identificadas. Resolva os itens com falha nos detalhes abaixo antes de prosseguir com a liberação de produção.'}
          </p>
        </div>
      )}

      {report && (
        <Tabs defaultValue="readiness" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="readiness">Diagnóstico de Passagem</TabsTrigger>
            <TabsTrigger value="links">Vínculos & Órfãos</TabsTrigger>
            <TabsTrigger value="cc">Centros de Custo</TabsTrigger>
            <TabsTrigger value="estoque">Inventário Saneado</TabsTrigger>
          </TabsList>

          <TabsContent value="readiness" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Critérios de Validação</CardTitle>
                <CardDescription>
                  Resumo dos testes técnicos automatizados executados na base de dados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistItem
                  title="Localização de Dados (Sem Órfãos ou Ocultos)"
                  passed={report.dataLocalizationPass}
                  fails={`${report.animaisSemLote.length} animais sem lote, ${report.pesagensOrfas.length} pesagens órfãs, ${report.tratosOrfaos.length} tratos órfãos.`}
                  gravity="Alta"
                />
                <ChecklistItem
                  title="Correção de Links e Relacionamentos"
                  passed={report.linksFixedPass}
                  fails={`${report.animaisSemLote.length} animais soltos, ${report.lotesSemCC.length} lotes sem CC.`}
                  gravity="Alta"
                />
                <ChecklistItem
                  title="Sanitização de Estoque e Insumos"
                  passed={report.inventoryPass}
                  fails={`${report.estoqueNegativo.length} insumos negativos, ${report.estoqueDuplicados.length} duplicados.`}
                  gravity="Média"
                />
                <ChecklistItem
                  title="Atribuição de Centro de Custos"
                  passed={report.costCenterPass}
                  fails={`${report.lotesSemCC.length} lotes ativos sem classificação.`}
                  gravity="Alta"
                />
                <ChecklistItem
                  title="Sincronização de Referência de Mercado (Arroba)"
                  passed={report.arrobaPass}
                  fails="Base de dados de preços de mercado sem referência recente ou com valores ausentes."
                  gravity="Média"
                />
                <ChecklistItem
                  title="Confiabilidade Operacional (Sem falhas críticas em 48h)"
                  passed={report.opsPass}
                  fails={`${report.errosLogs.length} erros críticos registrados recentemente.`}
                  gravity="Alta"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-indigo-600" /> Relacionamentos Rompidos
                </CardTitle>
                <CardDescription>
                  Listagem de registros que requerem intervenção manual devido à perda de vínculo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Animais Ativos Sem Lote ({report.animaisSemLote.length})
                    </h4>
                    {report.animaisSemLote.length === 0 ? (
                      <p className="text-sm text-emerald-600">Nenhum animal sem lote.</p>
                    ) : (
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                        {report.animaisSemLote.slice(0, 5).map((a: any) => (
                          <li key={a.id}>Brinco: {a.id_manejo_brinco}</li>
                        ))}
                        {report.animaisSemLote.length > 5 && (
                          <li>...e mais {report.animaisSemLote.length - 5}</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Pesagens Órfãs ({report.pesagensOrfas.length})
                    </h4>
                    {report.pesagensOrfas.length === 0 ? (
                      <p className="text-sm text-emerald-600">Nenhuma pesagem órfã.</p>
                    ) : (
                      <p className="text-sm text-slate-600">Requer limpeza manual via DB Admin.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Tratos Órfãos ({report.tratosOrfaos.length})
                    </h4>
                    {report.tratosOrfaos.length === 0 ? (
                      <p className="text-sm text-emerald-600">Nenhum trato órfão.</p>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Tratos apontando para lotes excluídos.
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Transações Financeiras Isoladas ({report.transacoesSemParceiro.length})
                    </h4>
                    {report.transacoesSemParceiro.length === 0 ? (
                      <p className="text-sm text-emerald-600">
                        Todas as transações possuem parceiro de negócio.
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600">Transações sem parceiro atrelado.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cc" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Lotes sem Centro de Custo
                  </CardTitle>
                  <CardDescription>
                    Normalização exigida para DRE e Fechamento Econômico.
                  </CardDescription>
                </div>
                {report.lotesSemCC.length > 0 && (
                  <Button onClick={handleFixLotesCC} disabled={fixing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${fixing ? 'animate-spin' : ''}`} />
                    Corrigir em Lote (Aplicar CC02)
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {report.lotesSemCC.length === 0 ? (
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-800">Perfeito</AlertTitle>
                    <AlertDescription className="text-emerald-700">
                      Todos os lotes ativos possuem Centro de Custo atribuído.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Atenção</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Foram encontrados {report.lotesSemCC.length} lotes ativos sem Centro de
                        Custo definido. O faturamento não considerará estes lotes nos relatórios.
                      </AlertDescription>
                    </Alert>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                      {report.lotesSemCC.map((l: any) => (
                        <li key={l.id}>
                          {l.nome_lote} ({l.quantidade_cabecas || 0} cabeças)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estoque" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" /> Anomalias de Estoque
                </CardTitle>
                <CardDescription>
                  Detecção de saldos negativos ou cadastros em duplicidade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Saldos Negativos ({report.estoqueNegativo.length})
                    </h4>
                    {report.estoqueNegativo.length === 0 ? (
                      <p className="text-sm text-emerald-600">Nenhum saldo negativo.</p>
                    ) : (
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                        {report.estoqueNegativo.map((e: any) => (
                          <li key={e.id} className="text-rose-600">
                            {e.produto}: {e.quantidade_atual} {e.unidade_medida}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Insumos Duplicados ({report.estoqueDuplicados.length})
                    </h4>
                    {report.estoqueDuplicados.length === 0 ? (
                      <p className="text-sm text-emerald-600">
                        Sem duplicidades detectadas (nome similar).
                      </p>
                    ) : (
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                        {report.estoqueDuplicados.map((e: any) => (
                          <li key={e.id}>{e.produto}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
