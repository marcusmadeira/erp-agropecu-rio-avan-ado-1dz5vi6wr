import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createSimulacao } from '@/services/simulacoes'
import { createAuditoria } from '@/services/auditoria'
import { getPrecosMercado } from '@/services/mercado'
import { calcularCenario, SimInputs } from '../utils/simulador-math'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { RelatorioSimuladorDialog } from './RelatorioSimuladorDialog'
import { useSystemConfig } from '@/hooks/use-system-config'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

const defaultInputs: SimInputs = {
  tipo_operacao: 'TIP',
  quantidade_animais: 100,
  peso_entrada: 300,
  preco_compra: 0,
  custo_acao: 5,
  custo_mao_obra: 1,
  custo_adicionais: 0.5,
  gmd_estimado: 1.2,
  dias_duracao: 90,
  preco_venda: 0,
}

export function SimuladorTab() {
  const [inputs, setInputs] = useState<SimInputs>(defaultInputs)
  const [loading, setLoading] = useState(false)
  const { config } = useSystemConfig()
  const { user } = useAuth()
  const [formulacoes, setFormulacoes] = useState<any[]>([])
  const [selectedFormulacao, setSelectedFormulacao] = useState<string>('none')
  const [consumoEstimado, setConsumoEstimado] = useState<string>('10')
  const [reportOpen, setReportOpen] = useState(false)
  const [ultimaSimulacao, setUltimaSimulacao] = useState<any>(null)

  const [lotes, setLotes] = useState<any[]>([])
  const [selectedLoteId, setSelectedLoteId] = useState<string>('none')
  const [loteWarning, setLoteWarning] = useState<string | null>(null)

  const { toast } = useToast()
  const res = calcularCenario(inputs)

  useEffect(() => {
    pb.collection('formulacoes_racao').getFullList().then(setFormulacoes).catch(console.error)
    pb.collection('lotes')
      .getFullList({ filter: "status='Ativo'", sort: 'nome_lote' })
      .then(setLotes)
      .catch(console.error)

    getPrecosMercado().then((p) => {
      if (p && p.preco_arroba) {
        setInputs((prev) => ({
          ...prev,
          preco_venda: p.preco_arroba,
          preco_compra: p.preco_arroba * 0.95,
        }))
      }
    })
  }, [])

  useEffect(() => {
    if (config && config.taxa_oportunidade_padrao !== undefined) {
      setInputs((prev) => ({ ...prev, taxa_oportunidade: config.taxa_oportunidade_padrao }))
    }
  }, [config])

  const handleLoteSelect = async (loteId: string) => {
    setSelectedLoteId(loteId)
    if (loteId === 'none') {
      setLoteWarning(null)
      return
    }

    setLoading(true)
    try {
      const lote = lotes.find((l) => l.id === loteId)
      if (!lote) return

      const animais = await pb
        .collection('animais')
        .getFullList({ filter: `lote_atual_id="${loteId}"` })
      const pesoMedio =
        lote.peso_medio_lote ||
        (animais.length
          ? animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0), 0) / animais.length
          : 0)

      const pesagensPage = await pb.collection('pesagens_diarias').getList(1, 50, {
        filter: `animal_id.lote_atual_id="${loteId}" && gmd_calculado > 0`,
        sort: '-data_pesagem',
      })
      const gmds = pesagensPage.items.map((p) => p.gmd_calculado).filter((g) => g && g > 0)
      const avgGmd = gmds.length ? gmds.reduce((a, b) => a + b, 0) / gmds.length : 0

      const qtty = lote.quantidade_cabecas || animais.length || inputs.quantidade_animais

      if (!pesoMedio || avgGmd === 0) {
        setLoteWarning(
          'Dados insuficientes para projeção automática. Insira os valores manualmente.',
        )
      } else {
        setLoteWarning(null)
      }

      setInputs((prev) => ({
        ...prev,
        tipo_operacao: `Lote: ${lote.nome_lote}`,
        quantidade_animais: qtty,
        peso_entrada: pesoMedio || prev.peso_entrada,
        gmd_estimado: avgGmd || prev.gmd_estimado,
      }))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleChange = (field: keyof SimInputs, val: string | number) => {
    setInputs((prev) => ({ ...prev, [field]: typeof val === 'string' ? Number(val) || 0 : val }))
  }

  const atualizarCustoRacao = (formId: string, consumo: string) => {
    if (formId === 'none') return
    const f = formulacoes.find((x) => x.id === formId)
    if (f && f.custo_kg_produzido) {
      const c = Number(consumo) || 0
      handleChange('custo_acao', Number((f.custo_kg_produzido * c).toFixed(2)))
    }
  }

  const handleFormulacaoChange = (v: string) => {
    setSelectedFormulacao(v)
    atualizarCustoRacao(v, consumoEstimado)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const savedSim = await createSimulacao({
        ...inputs,
        custo_total: res.custo_total,
        arrobas_produzidas: res.arrobas_produzidas_total,
        custo_arroba: res.custo_arroba_produzida,
        receita_total: res.receita_total,
        lucro_bruto: res.lucro_bruto,
        margem_lucro: res.margem_lucro,
        peso_final: res.peso_final,
        taxa_oportunidade_utilizada: res.taxa_oportunidade_utilizada,
        valor_custo_oportunidade: res.valor_custo_oportunidade,
      })

      await createAuditoria({
        usuario_id: user?.id,
        tipo_acao: 'CREATE',
        tabela_afetada: 'simulacoes_cenarios',
        registro_id: savedSim.id,
        description: `Simulação Salva - Operação: ${inputs.tipo_operacao}`,
        dados_novos: JSON.stringify({
          lucro_projetado: res.lucro_bruto,
          resultado_incremental: res.resultado_incremental,
        }),
      }).catch(console.error)

      toast({ title: 'Simulação salva com sucesso!' })
      setUltimaSimulacao(savedSim)
      setReportOpen(true)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  const precoPendente = !inputs.preco_venda || !inputs.preco_compra

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {precoPendente && !loading && (
        <div className="xl:col-span-3">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-semibold text-amber-900">
              Aguardando atualização do preço da arroba
            </AlertTitle>
            <AlertDescription>
              Os cálculos projetados estão bloqueados pois não há referência de preço válida.
              Atualize na Carga Inicial ou no Painel de Mercado para habilitar a simulação.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="xl:col-span-3 mb-2 bg-emerald-50/50 p-4 border border-emerald-100 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full max-w-sm">
            <Label>Selecionar Lote Base (Opcional)</Label>
            <Select value={selectedLoteId} onValueChange={handleLoteSelect} disabled={loading}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Nenhum (Simulação Genérica)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (Simulação Genérica)</SelectItem>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote} ({l.quantidade_cabecas} cab)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loteWarning && (
            <div className="flex-1 text-sm text-amber-700 bg-amber-100 p-2.5 rounded-md border border-amber-200">
              <span className="font-semibold">Atenção:</span> {loteWarning}
            </div>
          )}
        </div>
      </div>

      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle>Parâmetros da Operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo Operação</Label>
              <Select
                value={inputs.tipo_operacao}
                onValueChange={(v) => setInputs((prev) => ({ ...prev, tipo_operacao: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIP">TIP</SelectItem>
                  <SelectItem value="Confinamento">Confinamento</SelectItem>
                  {inputs.tipo_operacao.startsWith('Lote:') && (
                    <SelectItem value={inputs.tipo_operacao}>{inputs.tipo_operacao}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Qtd. Animais</Label>
              <Input
                type="number"
                value={inputs.quantidade_animais || ''}
                onChange={(e) => handleChange('quantidade_animais', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Peso Entrada/Atual (kg)</Label>
              <Input
                type="number"
                value={inputs.peso_entrada || ''}
                onChange={(e) => handleChange('peso_entrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo Base/Compra (@)</Label>
              <Input
                type="number"
                value={inputs.preco_compra || ''}
                onChange={(e) => handleChange('preco_compra', e.target.value)}
              />
            </div>

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border border-emerald-100 p-4 rounded-md bg-emerald-50/30">
              <div className="space-y-2">
                <Label>Ração Base (Opcional)</Label>
                <Select value={selectedFormulacao} onValueChange={handleFormulacaoChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {formulacoes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_formulacao} (R$ {f.custo_kg_produzido?.toFixed(2) || '0.00'}/kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consumo (kg/dia)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={consumoEstimado}
                  onChange={(e) => {
                    setConsumoEstimado(e.target.value)
                    atualizarCustoRacao(selectedFormulacao, e.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Custo Ração/dia</Label>
                <Input
                  type="number"
                  value={inputs.custo_acao || ''}
                  onChange={(e) => handleChange('custo_acao', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mão de Obra/dia</Label>
              <Input
                type="number"
                value={inputs.custo_mao_obra || ''}
                onChange={(e) => handleChange('custo_mao_obra', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Adicionais/dia</Label>
              <Input
                type="number"
                value={inputs.custo_adicionais || ''}
                onChange={(e) => handleChange('custo_adicionais', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>GMD Estimado (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={inputs.gmd_estimado || ''}
                onChange={(e) => handleChange('gmd_estimado', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duração (dias)</Label>
              <Input
                type="number"
                value={inputs.dias_duracao || ''}
                onChange={(e) => handleChange('dias_duracao', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço Venda (@)</Label>
              <Input
                type="number"
                value={inputs.preco_venda || ''}
                onChange={(e) => handleChange('preco_venda', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Oportunidade (% a.m.)</Label>
              <Input
                type="number"
                step="0.01"
                value={inputs.taxa_oportunidade ?? ''}
                onChange={(e) => handleChange('taxa_oportunidade', e.target.value)}
                placeholder="Ex: 1.0"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || precoPendente}
            className="w-full mt-4 bg-[#094016] hover:bg-[#094016]/90 text-white disabled:opacity-50"
          >
            Salvar Simulação
          </Button>
        </CardContent>
      </Card>

      {!precoPendente && (
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#094016] text-white md:col-span-2">
              <CardContent className="pt-6">
                <div className="text-sm text-emerald-100">
                  Resultado Incremental (Espera de {inputs.dias_duracao} dias)
                </div>
                <div className="text-3xl font-bold">
                  R${' '}
                  {res.resultado_incremental.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-emerald-200 mt-2">
                  Lucro Hoje: R${' '}
                  {res.lucro_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} → Lucro
                  Projetado: R${' '}
                  {res.lucro_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">ROI Projetado</div>
                <div className="text-2xl font-bold">{res.roi.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Margem de Lucro</div>
                <div className="text-2xl font-bold">{res.margem_lucro.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Ponto de Equilíbrio</div>
                <div className="text-2xl font-bold">R$ {res.ponto_equilibrio.toFixed(2)} /@</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Custo @ Produzida</div>
                <div className="text-2xl font-bold">R$ {res.custo_arroba_produzida.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Peso Final Estimado</div>
                <div className="text-2xl font-bold">{res.peso_final.toFixed(1)} kg</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Arrobas Produzidas</div>
                <div className="text-2xl font-bold">
                  {res.arrobas_produzidas_total.toFixed(1)} @
                </div>
              </CardContent>
            </Card>
          </div>

          <RelatorioSimuladorDialog
            sim={ultimaSimulacao}
            open={reportOpen}
            onOpenChange={setReportOpen}
          />

          <Card>
            <CardHeader>
              <CardTitle>Análise de Sensibilidade (Lucro vs Preço de Venda)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{ lucro: { label: 'Lucro Projetado (R$)', color: 'hsl(var(--chart-1))' } }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={res.sensibilidade}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cenario" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine
                      y={res.lucro_hoje}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{
                        position: 'insideTopLeft',
                        value: 'Lucro Hoje',
                        fill: '#f59e0b',
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#094016"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
