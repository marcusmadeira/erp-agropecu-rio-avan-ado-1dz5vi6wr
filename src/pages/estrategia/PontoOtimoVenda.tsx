import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Calculator,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase/client'
import { createAuditoria } from '@/services/auditoria'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

interface LoteAnalise {
  id: string
  nome: string
  quantidade: number
  pesoAtualKg: number
  diasNoCiclo: number
  margemAtual: number
  margemProjetada: number
  gmdMedio: number
  custoDiarioTotal: number
  valorGanhoDiario: number
  status: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY'
  recomendacao: string
  motivo: string
}

export default function PontoOtimoVenda() {
  const [analises, setAnalises] = useState<LoteAnalise[]>([])
  const [loading, setLoading] = useState(true)
  const [precoArrobaRef, setPrecoArrobaRef] = useState(0)
  const [dataReferenciaMercado, setDataReferenciaMercado] = useState<string | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime('precos_mercado', () => {
    loadData()
  })
  useRealtime('estoque_insumos', () => {
    loadData()
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [lotes, animais, pesagens, precos, tratos] = await Promise.all([
        pb.collection('lotes').getFullList({ expand: 'formulacao_id', filter: 'status="Ativo"' }),
        pb.collection('animais').getFullList({ filter: 'status!="Vendido" && status!="Morto"' }),
        pb.collection('pesagens_diarias').getFullList({ sort: '-data_pesagem' }),
        pb.collection('precos_mercado').getList(1, 1, { sort: '-data_registro' }),
        pb.collection('trato_diario_lotes').getFullList({ sort: '-data' }),
      ])

      const precoArroba = precos.items[0]?.preco_arroba || 0
      setPrecoArrobaRef(precoArroba)
      setDataReferenciaMercado(precos.items[0]?.data_registro || null)

      const results: LoteAnalise[] = lotes
        .map((lote) => {
          const animaisLote = animais.filter((a) => a.lote_atual_id === lote.id)
          const quantidade = animaisLote.length

          if (quantidade === 0) return null

          const pesoAtualTotal = animaisLote.reduce((acc, a) => acc + (a.peso_atual_kg || 0), 0)

          // GMD Calculation
          let totalGmd = 0
          let animaisComGmd = 0
          animaisLote.forEach((a) => {
            const p = pesagens.find((p) => p.animal_id === a.id)
            if (p && p.gmd_calculado) {
              totalGmd += p.gmd_calculado
              animaisComGmd++
            }
          })
          const gmdMedio = animaisComGmd > 0 ? totalGmd / animaisComGmd : 0

          const diasNoCiclo =
            Math.floor((Date.now() - new Date(lote.created).getTime()) / 86400000) || 1

          // Daily Cost
          const lastTrato = tratos.find((t) => t.lote_id === lote.id)
          let custoDiarioRacaoCabeca = 0
          if (lastTrato && lastTrato.custo_total_trato) {
            custoDiarioRacaoCabeca = lastTrato.custo_total_trato / quantidade
          } else if (
            lote.quantidade_racao_diaria &&
            lote.expand?.formulacao_id?.custo_kg_produzido
          ) {
            custoDiarioRacaoCabeca =
              (lote.quantidade_racao_diaria * lote.expand.formulacao_id.custo_kg_produzido) /
              quantidade
          }

          const custoOperacionalDiarioCabeca = 1.5 // Fixed structural estimate per head
          const custoDiarioCabeca = custoDiarioRacaoCabeca + custoOperacionalDiarioCabeca

          // Projections
          const valorGanhoDiarioCabeca = (gmdMedio / 15) * precoArroba
          const margemIncrementalDiariaLote =
            (valorGanhoDiarioCabeca - custoDiarioCabeca) * quantidade

          // Real Accumulated Cost
          const custoAcumuladoNutricao = lote.custo_acumulado_nutricao || 0
          const custoVariavelAnimais = animaisLote.reduce(
            (acc, a) => acc + (a.custo_variavel_acumulado || 0),
            0,
          )
          const custoAcumuladoTotal = custoAcumuladoNutricao + custoVariavelAnimais

          const receitaAtualLote = (pesoAtualTotal / 15) * precoArroba
          const margemAtual = receitaAtualLote - custoAcumuladoTotal
          const margemProjetada = margemAtual + margemIncrementalDiariaLote * 30

          // Status Logic
          let status: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY' = 'GRAY'
          let recomendacao = 'Dados insuficientes para recomendação'
          let motivo = 'Faltam registros de peso, preço ou trato'

          if (precoArroba > 0 && gmdMedio > 0 && custoDiarioCabeca > 0) {
            if (custoDiarioCabeca > valorGanhoDiarioCabeca) {
              status = 'RED'
              recomendacao = 'Vender'
              motivo = 'Custo diário superior ao ganho (Prejuízo na retenção)'
            } else if (margemIncrementalDiariaLote > 0 && gmdMedio >= 1.0) {
              status = 'GREEN'
              recomendacao = 'Segurar'
              motivo = 'Margem alvo atingida e GMD favorável (Ponto ótimo)'
            } else {
              status = 'YELLOW'
              recomendacao = 'Monitorar'
              motivo = 'GMD em declínio ou margem estreita'
            }
          }

          return {
            id: lote.id,
            nome: lote.nome_lote,
            quantidade,
            pesoAtualKg: pesoAtualTotal,
            diasNoCiclo,
            margemAtual,
            margemProjetada,
            gmdMedio,
            custoDiarioTotal: custoDiarioCabeca * quantidade,
            valorGanhoDiario: valorGanhoDiarioCabeca * quantidade,
            status,
            recomendacao,
            motivo,
          }
        })
        .filter(Boolean) as LoteAnalise[]

      // Commercial Priority Sorting: Red (1), Green (2), Yellow (3), Gray (4)
      const priorityMap = { RED: 1, GREEN: 2, YELLOW: 3, GRAY: 4 }
      results.sort((a, b) => priorityMap[a.status] - priorityMap[b.status])

      setAnalises(results)
      checkAndLogAudits(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const checkAndLogAudits = async (newAnalises: LoteAnalise[]) => {
    if (!user) return
    try {
      const lastAudits = await pb.collection('auditoria_movimentacoes').getFullList({
        filter: `tabela_afetada="lotes_recomendacao"`,
        sort: '-created',
      })

      for (const a of newAnalises) {
        if (a.status === 'GRAY') continue

        const lastForLote = lastAudits.find((x) => x.registro_id === a.id)
        let oldStatus = null
        if (lastForLote?.dados_novos) {
          try {
            oldStatus = JSON.parse(lastForLote.dados_novos).status
          } catch (e) {
            // ignore
          }
        }

        if (oldStatus !== a.status) {
          await createAuditoria({
            usuario_id: user.id,
            tipo_acao: 'Criação',
            tabela_afetada: 'lotes_recomendacao',
            registro_id: a.id,
            dados_novos: JSON.stringify({ status: a.status, recomendacao: a.recomendacao }),
            description: `Análise Comercial: Recomendação atualizada para ${a.recomendacao}. Motivo: ${a.motivo}`,
          })
        }
      }
    } catch (err) {
      console.error('Error logging audits', err)
    }
  }

  const handleSimulate = (lote: LoteAnalise) => {
    const simInputs = {
      tipo_operacao: 'Confinamento',
      quantidade_animais: lote.quantidade,
      peso_entrada: lote.pesoAtualKg / lote.quantidade,
      preco_compra: precoArrobaRef * 15,
      custo_acumulado_base: lote.margemAtual < 0 ? Math.abs(lote.margemAtual) : 0,
      custo_acao: lote.custoDiarioTotal / lote.quantidade,
      custo_mao_obra: 0,
      custo_adicionais: 0,
      gmd_estimado: lote.gmdMedio,
      dias_duracao: 30,
      preco_venda: precoArrobaRef,
      taxa_oportunidade: 1,
    }
    // Set in localStorage to easily prefill across components that lack explicit props wiring
    localStorage.setItem('SIMULADOR_PREFILL', JSON.stringify(simInputs))
    navigate('/simulador-cenarios', { state: { simInputs } })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GREEN':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'YELLOW':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'RED':
        return <XCircle className="w-5 h-5 text-rose-600" />
      default:
        return <Info className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'GREEN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'YELLOW':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'RED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <Target className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Semáforo de Ponto Ótimo de Venda
          </h1>
          <p className="text-slate-500 mt-1">
            Classificação inteligente para decisões comerciais em tempo real
          </p>
        </div>
      </div>

      {precoArrobaRef === 0 && !loading && (
        <Alert className="bg-rose-50 border-rose-200 text-rose-800 mb-6">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="font-semibold text-rose-900">
            Acesso Bloqueado: Realize a carga inicial do preço da arroba no Setup Inicial.
          </AlertTitle>
          <AlertDescription>
            Não há preço de arroba registrado no mercado. Atualize o Setup Inicial para habilitar as
            projeções.
            <br />
            <Link to="/admin/setup-inicial" className="underline font-medium hover:text-rose-900">
              Ir para o Setup Inicial
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            Painel Operacional Comercial
          </CardTitle>
          {dataReferenciaMercado && (
            <Badge variant="outline" className="bg-white text-slate-600 shadow-sm">
              Ref. Mercado: {new Date(dataReferenciaMercado).toLocaleDateString('pt-BR')} (R${' '}
              {precoArrobaRef.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : precoArrobaRef === 0 ? (
            <div className="p-8 text-center text-slate-500">
              O acesso a este módulo requer um preço de arroba válido.
            </div>
          ) : analises.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhum lote ativo encontrado para análise.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Lote</th>
                    <th className="px-4 py-3 font-semibold">Status / Motivo</th>
                    <th className="px-4 py-3 font-semibold text-right">Peso Atual (kg)</th>
                    <th className="px-4 py-3 font-semibold text-center">Dias no Ciclo</th>
                    <th className="px-4 py-3 font-semibold text-right">Margem Atual</th>
                    <th className="px-4 py-3 font-semibold text-right">Margem Proj. (30d)</th>
                    <th className="px-4 py-3 font-semibold">Recomendação</th>
                    <th className="px-4 py-3 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analises.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {a.nome}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {a.quantidade} cabeças
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getStatusIcon(a.status)}</div>
                          <div>
                            <Badge
                              variant="outline"
                              className={cn('mb-1 font-medium', getStatusBg(a.status))}
                            >
                              {a.status === 'GREEN'
                                ? 'ÓTIMO'
                                : a.status === 'YELLOW'
                                  ? 'ATENÇÃO'
                                  : a.status === 'RED'
                                    ? 'RISCO'
                                    : 'INCOMPLETO'}
                            </Badge>
                            <div className="text-xs text-slate-600 max-w-[200px] leading-tight">
                              {a.motivo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {a.pesoAtualKg.toLocaleString('pt-BR')} kg
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{a.diasNoCiclo}</td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-medium',
                          a.margemAtual >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        R${' '}
                        {a.margemAtual.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-medium',
                          a.margemProjetada >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        R${' '}
                        {a.margemProjetada.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{a.recomendacao}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 gap-1.5"
                          onClick={() => handleSimulate(a)}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          Simular
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
