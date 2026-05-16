import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle, ShieldCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Sanitizacao() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  const runAudit = async () => {
    setLoading(true)
    try {
      const p = (col: string, filter: string) => pb.collection(col).getFullList({ filter })
      const [aL, lCC, pA, tR, fR, eN, eA, pr, err] = await Promise.all([
        p('animais', 'lote_atual_id=""'),
        p('lotes', 'status="Ativo" && (centro_custo="" || centro_custo=null)'),
        p('pesagens_diarias', 'animal_id=""'),
        p('trato_diario_lotes', 'lote_id="" || formulacao_id=""'),
        p('transacoes_financeiras', 'parceiro_id="" || centro_custo=""'),
        p('estoque_insumos', 'quantidade_atual<0'),
        pb.collection('estoque_insumos').getFullList(),
        pb.collection('precos_mercado').getList(1, 1, { sort: '-data_registro' }),
        p(
          'logs_sistema',
          `tipo_evento='Erro' && created>='${new Date(Date.now() - 172800000).toISOString()}'`,
        ),
      ])

      const counts = eA.reduce(
        (acc: any, i) => ({ ...acc, [i.produto]: (acc[i.produto] || 0) + 1 }),
        {},
      )
      const eD = eA.filter((e) => counts[e.produto] > 1)

      setStats({ aL, lCC, pA, tR, fR, eN, eD, err, pr: pr.items[0] || null })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runAudit()
  }, [])

  const fixLotes = async () => {
    setLoading(true)
    for (const l of stats.lCC)
      await pb
        .collection('lotes')
        .update(l.id, { centro_custo: 'CC01-Nelore PO' })
        .catch(() => null)
    toast({ title: 'Lotes atualizados' })
    runAudit()
  }

  const fixEstoque = async () => {
    setLoading(true)
    for (const e of stats.eN)
      await pb
        .collection('estoque_insumos')
        .update(e.id, { quantidade_atual: 0 })
        .catch(() => null)
    toast({ title: 'Estoque zerado' })
    runAudit()
  }

  if (!stats) return <div className="p-8 text-center animate-pulse">Carregando auditoria...</div>

  const passV = stats.pA.length === 0 && stats.tR.length === 0 && stats.fR.length === 0
  const passL = stats.aL.length === 0 && stats.lCC.length === 0
  const passE = stats.eN.length === 0 && stats.eD.length === 0
  const passP = !!stats.pr && stats.pr.preco_arroba > 0
  const passO = stats.err.length === 0
  const allPass = passV && passL && passE && passP && passO

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> Sanitização Técnica
          </h1>
          <p className="text-slate-500">Validação para liberação de produção</p>
        </div>
        <Button onClick={runAudit} disabled={loading}>
          <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>
      <Tabs defaultValue="chk" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chk">Checklist Final</TabsTrigger>
          <TabsTrigger value="vis">Visibilidade & Vínculos</TabsTrigger>
          <TabsTrigger value="est">Estoque</TabsTrigger>
        </TabsList>
        <TabsContent value="chk">
          <Card>
            <CardHeader className={allPass ? 'bg-emerald-50' : 'bg-rose-50'}>
              <CardTitle className="flex gap-2 items-center">
                {allPass ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
                Veredito: {allPass ? 'LIBERAÇÃO AUTORIZADA' : 'NÃO AUTORIZADA'}
              </CardTitle>
              <CardDescription>
                {allPass ? 'Sistema consistente.' : 'Corrija as inconsistências abaixo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid gap-4">
              <Row pass={passV} label="Localização de Dados" desc="Nenhum dado invisível." />
              <Row
                pass={passL}
                label="Vínculos Críticos"
                desc="Relações entre Lotes/Animais consistentes."
              />
              <Row
                pass={passE}
                label="Estoque Sanitizado"
                desc="Sem saldos negativos ou duplicados."
              />
              <Row
                pass={passP}
                label="Preço de Mercado"
                desc="Arroba utilizando preço atualizado."
              />
              <Row pass={passO} label="Confiabilidade" desc="Sem erros nas últimas 48h." />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações Manuais ou Em Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-slate-50">
                <div>
                  <h4 className="font-semibold">Lotes sem CC Ativo ({stats.lCC.length})</h4>
                </div>
                <Button
                  onClick={fixLotes}
                  disabled={loading || !stats.lCC.length}
                  variant="outline"
                >
                  Atribuir CC01
                </Button>
              </div>
              <Issue c={stats.aL.length} l="Animais sem Lote" />
              <Issue c={stats.pA.length} l="Pesagens sem Animal" />
              <Issue c={stats.tR.length} l="Tratos sem Relação" />
              <Issue c={stats.fR.length} l="Finanças sem Relacionamento" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="est">
          <Card>
            <CardHeader>
              <CardTitle>Sanitização de Insumos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg bg-slate-50">
                <div>
                  <h4 className="font-semibold">Saldos Negativos ({stats.eN.length})</h4>
                </div>
                <Button
                  onClick={fixEstoque}
                  disabled={loading || !stats.eN.length}
                  variant="outline"
                >
                  Zerar Saldos
                </Button>
              </div>
              <Issue c={stats.eD.length} l="Produtos Duplicados" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Row({ pass, label, desc }: any) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      {pass ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <XCircle className="w-5 h-5 text-rose-500" />
      )}
      <div>
        <h4 className={`font-semibold ${pass ? 'text-slate-900' : 'text-rose-900'}`}>{label}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  )
}
function Issue({ c, l }: any) {
  if (!c) return null
  return (
    <div className="flex gap-3 p-3 border rounded-lg bg-amber-50 border-amber-200 text-amber-900">
      <AlertTriangle className="w-5 h-5 text-amber-600" />
      <span>
        <strong>{c}</strong> {l} encontrados.
      </span>
    </div>
  )
}
