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

const defaultInputs: SimInputs = {
  tipo_operacao: 'TIP',
  quantidade_animais: 100,
  peso_entrada: 300,
  preco_compra: 220,
  custo_acao: 5,
  custo_mao_obra: 1,
  custo_adicionais: 0.5,
  gmd_estimado: 1.2,
  dias_duracao: 90,
  preco_venda: 230,
}

export function SimuladorTab() {
  const [inputs, setInputs] = useState<SimInputs>(defaultInputs)
  const [loading, setLoading] = useState(false)
  const { config } = useSystemConfig()
  const [formulacoes, setFormulacoes] = useState<any[]>([])
  const [selectedFormulacao, setSelectedFormulacao] = useState<string>('none')
  const [consumoEstimado, setConsumoEstimado] = useState<string>('10')
  const [reportOpen, setReportOpen] = useState(false)
  const [ultimaSimulacao, setUltimaSimulacao] = useState<any>(null)
  const { toast } = useToast()
  const res = calcularCenario(inputs)

  useEffect(() => {
    import('@/lib/pocketbase/client').then(({ default: pb }) => {
      pb.collection('formulacoes_racao').getFullList().then(setFormulacoes).catch(console.error)
    })

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
        roi: res.roi,
        peso_final: res.peso_final,
        taxa_oportunidade_utilizada: res.taxa_oportunidade_utilizada,
        valor_custo_oportunidade: res.valor_custo_oportunidade,
      })
      toast({ title: 'Simulação salva com sucesso!' })
      setUltimaSimulacao(savedSim)
      setReportOpen(true)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
              <Label>Peso Entrada (kg)</Label>
              <Input
                type="number"
                value={inputs.peso_entrada || ''}
                onChange={(e) => handleChange('peso_entrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço Compra (@)</Label>
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
                  <SelectTrigger>
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
                step="0.1"
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
            disabled={loading}
            className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white"
          >
            Salvar Simulação
          </Button>
        </CardContent>
      </Card>

      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Lucro Bruto</div>
              <div className="text-2xl font-bold text-[#094016]">
                R${' '}
                {res.lucro_bruto.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">ROI Esperado</div>
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
              config={{ lucro: { label: 'Lucro (R$)', color: 'hsl(var(--chart-1))' } }}
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
    </div>
  )
}
