import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { AlertTriangle, ShieldAlert, Package, TrendingUp, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { createAuditoria } from '@/services/auditoria'

interface Insumo {
  id: string
  produto: string
  quantidade_atual: number
  unidade_medida: string
}

interface PrecoMercado {
  id: string
  data_registro: string
  preco_arroba: number
  fonte: string
  regiao: string
}

export default function CargaInicial() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [precos, setPrecos] = useState<PrecoMercado[]>([])
  const [loading, setLoading] = useState(false)

  // Estoque state
  const [saldosFisicos, setSaldosFisicos] = useState<Record<string, string>>({})
  const [justificativas, setJustificativas] = useState<Record<string, string>>({})
  const [adjustingId, setAdjustingId] = useState<string | null>(null)

  // Preço state
  const [precoData, setPrecoData] = useState(new Date().toISOString().split('T')[0])
  const [precoArroba, setPrecoArroba] = useState('')
  const [precoRegiao, setPrecoRegiao] = useState('')
  const [precoFonte, setPrecoFonte] = useState('Manual/Carga Inicial')

  const isAuthorized = user?.role === 'Admin' || user?.nivel_acesso === 'Gerente'

  useEffect(() => {
    if (isAuthorized) {
      loadInsumos()
      loadPrecos()
    }
  }, [isAuthorized])

  const loadInsumos = async () => {
    try {
      const records = await pb.collection('estoque_insumos').getFullList<Insumo>({
        sort: 'produto',
      })
      setInsumos(records)
    } catch (e) {
      console.error(e)
    }
  }

  const loadPrecos = async () => {
    try {
      const records = await pb.collection('precos_mercado').getFullList<PrecoMercado>({
        sort: '-data_registro',
      })
      setPrecos(records)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAjusteEstoque = async (insumo: Insumo) => {
    const saldoFisicoStr = saldosFisicos[insumo.id]
    const justificativa = justificativas[insumo.id]

    if (!saldoFisicoStr || saldoFisicoStr.trim() === '') {
      toast({ title: 'Erro', description: 'Informe o Saldo Físico Real.', variant: 'destructive' })
      return
    }

    const saldoFisico = Number(saldoFisicoStr)
    if (saldoFisico < 0) {
      toast({
        title: 'Erro',
        description: 'O saldo físico não pode ser negativo.',
        variant: 'destructive',
      })
      return
    }

    if (!justificativa || justificativa.trim() === '') {
      toast({
        title: 'Erro',
        description: 'A justificativa é obrigatória para o ajuste.',
        variant: 'destructive',
      })
      return
    }

    const diff = saldoFisico - insumo.quantidade_atual

    if (diff === 0) {
      toast({
        title: 'Aviso',
        description: 'O saldo físico é igual ao saldo do sistema.',
        variant: 'default',
      })
      return
    }

    setAdjustingId(insumo.id)
    try {
      const tipoMovimento = diff > 0 ? 'ENTRADA_MANUAL' : 'SAIDA_MANUAL'
      const quantidadeMovimento = Math.abs(diff)

      // 1. Save movimento
      await pb.collection('estoque_movimentacoes').create({
        tipo: tipoMovimento,
        produto_id: insumo.id,
        quantidade: quantidadeMovimento,
        data: new Date().toISOString(),
        usuario_id: user?.id,
        motivo_ajuste: `Carga Inicial: ${justificativa}`,
      })

      // 2. Update insumo
      await pb.collection('estoque_insumos').update(insumo.id, {
        quantidade_atual: saldoFisico,
      })

      // 3. Audit
      await createAuditoria({
        usuario_id: user?.id || '',
        tipo_acao: 'UPDATE',
        tabela_afetada: 'estoque_insumos',
        registro_id: insumo.id,
        dados_anteriores: JSON.stringify({ quantidade_atual: insumo.quantidade_atual }),
        dados_novos: JSON.stringify({ quantidade_atual: saldoFisico }),
        description: `Setup Inicial: Ajuste de estoque. Diferença: ${diff}. Justificativa: ${justificativa}`,
        status: 'SUCCESS',
      })

      toast({ title: 'Sucesso', description: 'Estoque ajustado com sucesso!' })

      // Clear inputs for this item
      setSaldosFisicos((prev) => ({ ...prev, [insumo.id]: '' }))
      setJustificativas((prev) => ({ ...prev, [insumo.id]: '' }))

      loadInsumos()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setAdjustingId(null)
    }
  }

  const handleSalvarPreco = async () => {
    if (!precoData || !precoArroba) {
      toast({
        title: 'Erro',
        description: 'Data e Preço da Arroba são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Check for duplicates
      const check = await pb.collection('precos_mercado').getFullList({
        filter: `data_registro >= "${precoData} 00:00:00" && data_registro <= "${precoData} 23:59:59"`,
      })

      if (check.length > 0) {
        toast({
          title: 'Atenção',
          description: 'Já existe um preço registrado para esta data.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const val = Number(precoArroba)

      const record = await pb.collection('precos_mercado').create({
        data_registro: new Date(precoData + 'T12:00:00Z').toISOString(),
        preco_arroba: val,
        fonte: precoFonte,
        regiao: precoRegiao,
      })

      await createAuditoria({
        usuario_id: user?.id || '',
        tipo_acao: 'CREATE',
        tabela_afetada: 'precos_mercado',
        registro_id: record.id,
        dados_novos: JSON.stringify({ preco_arroba: val, data: precoData }),
        description: `Setup Inicial: Registro de preço base. Valor: R$ ${val}`,
        status: 'SUCCESS',
      })

      toast({ title: 'Sucesso', description: 'Preço de mercado registrado com sucesso!' })
      setPrecoArroba('')
      loadPrecos()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
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
            O Setup Inicial é restrito a usuários com perfil de Gerente ou Administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Setup Inicial</h1>
          <p className="text-slate-500 mt-1">
            Insira a contagem física e preços de referência para liberar os cálculos do ERP.
          </p>
        </div>
      </div>

      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-semibold text-amber-900">Atenção</AlertTitle>
        <AlertDescription>
          Os dados inseridos aqui afetam diretamente as projeções, simuladores e custos do sistema.
          Todas as alterações são registradas na trilha de auditoria.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="estoque" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="estoque" className="gap-2">
            <Package className="w-4 h-4" /> Estoque Físico (Insumos)
          </TabsTrigger>
          <TabsTrigger value="precos" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Preços de Mercado (Arroba)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajuste de Estoque Físico</CardTitle>
              <CardDescription>
                Confronte o saldo atual do sistema com a contagem física real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Produto</th>
                      <th className="px-4 py-3 font-semibold">Unidade</th>
                      <th className="px-4 py-3 font-semibold text-right">Saldo Sistema</th>
                      <th className="px-4 py-3 font-semibold">Saldo Físico Real</th>
                      <th className="px-4 py-3 font-semibold">Justificativa do Ajuste</th>
                      <th className="px-4 py-3 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {insumos.map((insumo) => (
                      <tr key={insumo.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{insumo.produto}</td>
                        <td className="px-4 py-3 text-slate-600">{insumo.unidade_medida}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {insumo.quantidade_atual.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="w-32"
                            value={saldosFisicos[insumo.id] || ''}
                            onChange={(e) =>
                              setSaldosFisicos((prev) => ({ ...prev, [insumo.id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            placeholder="Ex: Contagem inicial"
                            className="min-w-[200px]"
                            value={justificativas[insumo.id] || ''}
                            onChange={(e) =>
                              setJustificativas((prev) => ({
                                ...prev,
                                [insumo.id]: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={adjustingId === insumo.id}
                            onClick={() => handleAjusteEstoque(insumo)}
                          >
                            {adjustingId === insumo.id ? 'Salvando...' : 'Ajustar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {insumos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Nenhum insumo cadastrado no sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Preço Base (Arroba)</CardTitle>
              <CardDescription>
                Defina a referência inicial de mercado para habilitar os simuladores e projeções.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <Label>Data de Referência</Label>
                  <Input
                    type="date"
                    value={precoData}
                    onChange={(e) => setPrecoData(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Arroba (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 230.00"
                    value={precoArroba}
                    onChange={(e) => setPrecoArroba(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região (Opcional)</Label>
                  <Input
                    type="text"
                    placeholder="Ex: SP"
                    value={precoRegiao}
                    onChange={(e) => setPrecoRegiao(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSalvarPreco}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Registrar Preço
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Histórico Recente</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Data</th>
                        <th className="px-4 py-3 font-semibold">Preço Arroba</th>
                        <th className="px-4 py-3 font-semibold">Região</th>
                        <th className="px-4 py-3 font-semibold">Fonte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {precos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            {new Date(p.data_registro).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 font-medium text-emerald-700">
                            R${' '}
                            {p.preco_arroba.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.regiao || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{p.fonte || '-'}</td>
                        </tr>
                      ))}
                      {precos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            Nenhum preço registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
