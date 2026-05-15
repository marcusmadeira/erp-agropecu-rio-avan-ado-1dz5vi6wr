import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Calendar,
  Phone,
  DollarSign,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays, startOfDay, isValid } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export function BillingAlertsWidget() {
  const [parcelas, setParcelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const records = await pb.collection('parcelas_venda').getFullList({
        filter: "status_parcela = 'Pendente' || status_parcela = 'Atrasada'",
        expand: 'venda_id,venda_id.cliente_id',
        sort: 'data_vencimento',
      })
      setParcelas(records)

      if (records.length > 0) {
        await pb
          .collection('auditoria_movimentacoes')
          .create({
            usuario_id: pb.authStore.model?.id,
            tipo_acao: 'READ',
            tabela_afetada: 'parcelas_venda',
            registro_id: 'bulk',
            description: `Visualização do painel de Alertas Internos de Cobrança com ${records.length} pendências.`,
          })
          .catch(() => {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('parcelas_venda', () => loadData())

  const alerts = useMemo(() => {
    const today = startOfDay(new Date())
    const arr: any[] = []

    const unique = new Map()
    for (const p of parcelas) {
      if (!unique.has(p.id)) {
        unique.set(p.id, p)
      }
    }

    for (const p of Array.from(unique.values())) {
      if (p.data_proxima_tentativa) {
        const prox = startOfDay(new Date(p.data_proxima_tentativa.substring(0, 10) + 'T00:00:00'))
        if (prox > today) continue
      }

      const vencStr = p.data_vencimento.substring(0, 10)
      const dt = startOfDay(new Date(vencStr + 'T00:00:00'))
      if (!isValid(dt)) continue
      const diff = differenceInDays(dt, today)

      let title = ''
      let color = ''
      let action = ''
      let urgent = false

      if (diff === 2) {
        title = 'Vence em 2 dias'
        color = 'bg-blue-100 text-blue-800'
        action = 'Lembrar cliente amigavelmente'
      } else if (diff === 1) {
        title = 'Vencendo Amanhã'
        color = 'bg-yellow-100 text-yellow-800'
        action = 'Aviso de vencimento próximo'
      } else if (diff === 0) {
        title = 'Vence Hoje'
        color = 'bg-orange-100 text-orange-800'
        action = 'Notificar vencimento hoje'
        urgent = true
      } else if (diff === -1) {
        title = 'Vencida Ontem'
        color = 'bg-red-100 text-red-800'
        action = 'Cobrança imediata'
        urgent = true
      } else if (diff <= -2) {
        title = `Atrasada há ${Math.abs(diff)} dias`
        color = 'bg-rose-100 text-rose-800'
        action = 'Cobrança urgente / Negociação'
        urgent = true
      }

      if (title) {
        arr.push({ parcela: p, diff, title, color, action, urgent })
      }
    }

    return arr.sort((a, b) => a.diff - b.diff)
  }, [parcelas])

  const handleAction = async (alerta: any, path: string) => {
    try {
      await pb.collection('auditoria_movimentacoes').create({
        usuario_id: pb.authStore.model?.id,
        tipo_acao: 'READ',
        tabela_afetada: 'parcelas_venda',
        registro_id: alerta.parcela.id,
        description: `Ação no alerta de cobrança (D${alerta.diff > 0 ? '+' + alerta.diff : alerta.diff}): Navegou para ${path}`,
      })
    } catch {
      /* intentionally ignored */
    }
    navigate(path)
  }

  if (loading && alerts.length === 0) return null

  if (!loading && alerts.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm border-amber-200 bg-amber-50/30 animate-fade-in-up mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg text-amber-900">Alertas de Cobrança Internos</CardTitle>
        </div>
        <Badge variant="outline" className="bg-white border-amber-300 text-amber-800">
          {alerts.length} alerta{alerts.length === 1 ? '' : 's'} ativo
          {alerts.length === 1 ? '' : 's'}
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[380px] pr-4">
          <div className="space-y-3">
            {alerts.map((alerta) => {
              const { parcela, title, color, action, urgent } = alerta
              const cliente = parcela.expand?.venda_id?.expand?.cliente_id
              const fone = cliente?.contato_whatsapp || cliente?.contato_whatsapp_cobranca

              return (
                <div
                  key={parcela.id}
                  className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between group hover:border-amber-300 transition-colors"
                >
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${color}`}
                      >
                        {title}
                      </span>
                      {urgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <span className="text-xs text-slate-500 font-mono ml-auto">
                        Status: {parcela.status_parcela}
                      </span>
                    </div>

                    <div
                      className="font-semibold text-slate-800 text-base line-clamp-1"
                      title={cliente?.nome_razao_social || 'Cliente não identificado'}
                    >
                      {cliente?.nome_razao_social || 'Cliente não identificado'}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-emerald-700">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(parcela.valor_parcela)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(
                          parcela.data_vencimento.substring(0, 10) + 'T00:00:00',
                        ).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {fone ? fone : <span className="italic opacity-60">Não cadastrado</span>}
                      </span>
                      {parcela.venda_id && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <ExternalLink className="h-3 w-3" />
                          Venda #{parcela.venda_id.substring(0, 5)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-amber-800 bg-amber-50/80 inline-block px-2 py-1 rounded mt-1 border border-amber-200">
                      <strong>Ação Sugerida:</strong> {action}
                    </div>
                  </div>

                  <div className="flex flex-row xl:flex-col gap-2 w-full xl:w-auto shrink-0 mt-1 xl:mt-0 justify-end">
                    <Button
                      size="sm"
                      className="w-full xl:w-auto bg-[#094016] text-white hover:bg-[#094016]/90"
                      onClick={() => handleAction(alerta, `/painel-cobranca`)}
                    >
                      Painel Cobrança
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full xl:w-auto text-slate-600 border-slate-200"
                      onClick={() => handleAction(alerta, `/vendas/geral/${parcela.venda_id}`)}
                    >
                      Ver Venda <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
