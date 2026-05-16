import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  AlertTriangle,
  ShieldAlert,
  Package,
  CheckCircle2,
  DollarSign,
  ListChecks,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { createAuditoria } from '@/services/auditoria'
import { format } from 'date-fns'

const STANDARD_ITEMS = ['Milho', 'Farelo de soja', 'Sal mineral', 'Núcleo', 'Ureia']

interface InsumoRow {
  id: string
  produto: string
  quantidade: string
  unidade: string
  exists: boolean
  original?: any
}

export default function CargaInicial() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [dataLevantamento, setDataLevantamento] = useState(new Date().toISOString().split('T')[0])
  const [precoArroba, setPrecoArroba] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [insumos, setInsumos] = useState<InsumoRow[]>([])

  const isAuthorized = user?.role === 'Admin' || user?.nivel_acesso === 'Gerente'

  useEffect(() => {
    if (isAuthorized) {
      loadInsumos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized])

  const loadInsumos = async () => {
    try {
      const existing = await pb.collection('estoque_insumos').getFullList({ sort: 'produto' })
      const mapped: InsumoRow[] = existing.map((e) => ({
        id: e.id,
        produto: e.produto,
        quantidade: e.quantidade_atual.toString(),
        unidade: e.unidade_medida,
        exists: true,
        original: e,
      }))

      const missing = STANDARD_ITEMS.filter(
        (std) => !mapped.some((m) => m.produto.toLowerCase() === std.toLowerCase()),
      )

      const missingRows = missing.map((m) => ({
        id: `novo-${m}`,
        produto: m,
        quantidade: '',
        unidade: 'kg',
        exists: false,
      }))

      setInsumos([...missingRows, ...mapped])
    } catch (e) {
      console.error(e)
    }
  }

  const handleInsumoChange = (id: string, field: keyof InsumoRow, value: string) => {
    setInsumos((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleExecuteLoad = async () => {
    if (!dataLevantamento || !precoArroba || !justificativa) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Data do levantamento, Preço da Arroba e Justificativa são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const invalidInsumos = insumos.filter(
      (i) => i.quantidade.trim() === '' || isNaN(Number(i.quantidade)) || !i.unidade,
    )
    if (invalidInsumos.length > 0) {
      toast({
        title: 'Valores Inválidos',
        description:
          'Todos os insumos devem ter uma quantidade numérica válida e unidade preenchida.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const dataFormatada = format(new Date(dataLevantamento + 'T12:00:00Z'), 'dd/MM/yyyy')
      const auditDesc = `Carga inicial de inventário e preço de arroba baseada em levantamento físico realizado em ${dataFormatada}. Motivo/Justificativa: ${justificativa}`

      const valPreco = Number(precoArroba)
      const precoRecord = await pb.collection('precos_mercado').create({
        data_registro: new Date(dataLevantamento + 'T12:00:00Z').toISOString(),
        preco_arroba: valPreco,
        fonte: 'Carga Inicial (Levantamento Físico)',
      })

      await createAuditoria({
        usuario_id: user?.id || '',
        tipo_acao: 'Criação',
        tabela_afetada: 'precos_mercado',
        registro_id: precoRecord.id,
        dados_novos: JSON.stringify({ preco_arroba: valPreco, data: dataLevantamento }),
        description: auditDesc,
        status: 'SUCCESS',
      })

      for (const insumo of insumos) {
        const qtde = Number(insumo.quantidade)
        if (insumo.exists) {
          await pb.collection('estoque_insumos').update(insumo.id, {
            quantidade_atual: qtde,
            unidade_medida: insumo.unidade,
          })

          const diff = qtde - (insumo.original?.quantidade_atual || 0)
          if (diff !== 0) {
            await pb.collection('estoque_movimentacoes').create({
              tipo: diff > 0 ? 'ENTRADA_MANUAL' : 'SAIDA_MANUAL',
              produto_id: insumo.id,
              quantidade: Math.abs(diff),
              data: new Date().toISOString(),
              usuario_id: user?.id,
              motivo_ajuste: `Carga Inicial: ${justificativa}`,
            })
          }

          await createAuditoria({
            usuario_id: user?.id || '',
            tipo_acao: 'UPDATE',
            tabela_afetada: 'estoque_insumos',
            registro_id: insumo.id,
            dados_anteriores: JSON.stringify({
              quantidade_atual: insumo.original?.quantidade_atual,
            }),
            dados_novos: JSON.stringify({ quantidade_atual: qtde }),
            description: auditDesc,
            status: 'SUCCESS',
          })
        } else {
          const created = await pb.collection('estoque_insumos').create({
            produto: insumo.produto,
            quantidade_atual: qtde,
            unidade_medida: insumo.unidade,
            categoria: 'Outros',
          })

          await pb.collection('estoque_movimentacoes').create({
            tipo: 'ENTRADA_MANUAL',
            produto_id: created.id,
            quantidade: qtde,
            data: new Date().toISOString(),
            usuario_id: user?.id,
            motivo_ajuste: `Carga Inicial: ${justificativa}`,
          })

          await createAuditoria({
            usuario_id: user?.id || '',
            tipo_acao: 'Criação',
            tabela_afetada: 'estoque_insumos',
            registro_id: created.id,
            dados_novos: JSON.stringify({ quantidade_atual: qtde, produto: insumo.produto }),
            description: auditDesc,
            status: 'SUCCESS',
          })
        }
      }

      toast({
        title: 'Status Final: Sucesso',
        description:
          'Carga inicial executada. Todos os simuladores e dashboards foram destravados.',
      })

      setPrecoArroba('')
      setJustificativa('')
      loadInsumos()
    } catch (e: any) {
      toast({ title: 'Status Final: Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-10">
        <Alert className="bg-rose-50 border-rose-200 text-rose-800">
          <ShieldAlert className="h-5 w-5 text-rose-600" />
          <AlertTitle className="font-semibold text-rose-900">Acesso Restrito</AlertTitle>
          <AlertDescription>
            A Carga Inicial é restrita a usuários com perfil de Gerente ou Administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <ListChecks className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Setup: Carga Inicial</h1>
          <p className="text-slate-500 mt-1">
            Execute o levantamento físico e libere as travas do sistema para simulações e
            dashboards.
          </p>
        </div>
      </div>

      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-semibold text-amber-900">Atenção Crítica</AlertTitle>
        <AlertDescription>
          A execução da Carga Inicial afeta diretamente as projeções financeiras, dashboards de
          custos e cálculos de Ponto Ótimo de Venda. Todas as alterações geram registros permanentes
          de auditoria.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Referência de Mercado
              </CardTitle>
              <CardDescription>
                Defina o preço da arroba para habilitar os simuladores.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Preço da Arroba (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 230.00"
                  value={precoArroba}
                  onChange={(e) => setPrecoArroba(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Vigência (Levantamento)</Label>
                <Input
                  type="date"
                  value={dataLevantamento}
                  onChange={(e) => setDataLevantamento(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Auditoria Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Justificativa / Motivo</Label>
                <Textarea
                  placeholder="Ex: Contagem inicial do estoque físico realizada pela equipe de pátio..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 h-full">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Inventário Físico de Insumos
            </CardTitle>
            <CardDescription>Ajuste as quantidades reais encontradas na fazenda.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Quantidade</th>
                    <th className="px-4 py-3 font-semibold">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insumos.map((insumo) => (
                    <tr key={insumo.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {insumo.produto}
                        {!insumo.exists && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">
                            Novo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="w-28 h-8"
                          value={insumo.quantidade}
                          onChange={(e) =>
                            handleInsumoChange(insumo.id, 'quantidade', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="text"
                          className="w-20 h-8"
                          value={insumo.unidade}
                          onChange={(e) => handleInsumoChange(insumo.id, 'unidade', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                  {insumos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Carregando insumos...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          size="lg"
          onClick={handleExecuteLoad}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
        >
          {loading ? (
            'Processando Carga...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Executar Carga Inicial e Destravar Sistema
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
