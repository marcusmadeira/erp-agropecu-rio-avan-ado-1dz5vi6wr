import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createDiagnostico, getDiagnosticos } from '@/services/diagnostico'
import { AlertCircle, CheckCircle2, Info, Target } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Diagnostico {
  id: string
  tamanho_ha: number
  total_animais: number
  arrobas_produzidas: number
  custos: number
  receitas: number
  custo_arroba: number
  lotacao: number
  produtividade_ha: number
  margem_lucro: number
  roi: number
  created: string
}

export default function DiagnosticoInicial() {
  const [historico, setHistorico] = useState<Diagnostico[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    tamanho_ha: '',
    total_animais: '',
    arrobas_produzidas: '',
    custos: '',
    receitas: '',
  })

  const [resultado, setResultado] = useState<Partial<Diagnostico> | null>(null)

  const loadHistorico = async () => {
    try {
      const data = await getDiagnosticos()
      setHistorico(data as Diagnostico[])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadHistorico()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const tamanho_ha = parseFloat(formData.tamanho_ha)
    const total_animais = parseFloat(formData.total_animais)
    const arrobas_produzidas = parseFloat(formData.arrobas_produzidas)
    const custos = parseFloat(formData.custos)
    const receitas = parseFloat(formData.receitas)

    if ([tamanho_ha, total_animais, arrobas_produzidas, custos, receitas].some(isNaN)) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos corretamente.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const custo_arroba = custos / arrobas_produzidas
    const lotacao = total_animais / tamanho_ha
    const produtividade_ha = arrobas_produzidas / tamanho_ha
    const margem_lucro = ((receitas - custos) / receitas) * 100
    const roi = ((receitas - custos) / custos) * 100

    const payload = {
      usuario_id: user?.id,
      tamanho_ha,
      total_animais,
      arrobas_produzidas,
      custos,
      receitas,
      custo_arroba,
      lotacao,
      produtividade_ha,
      margem_lucro,
      roi,
    }

    try {
      const saved = await createDiagnostico(payload)
      setResultado(saved as Diagnostico)
      toast({ title: 'Sucesso', description: 'Diagnóstico salvo com sucesso!' })
      loadHistorico()
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao salvar diagnóstico.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const renderBenchmark = (
    label: string,
    actual: number,
    benchmark: number,
    isHigherBetter: boolean,
    unit: string,
  ) => {
    const isGood = isHigherBetter ? actual >= benchmark : actual <= benchmark
    const color = isGood ? 'text-green-600' : 'text-red-600'
    const Icon = isGood ? CheckCircle2 : AlertCircle

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className={`text-2xl font-bold ${color}`}>
              {actual.toFixed(2)} {unit}
            </h4>
            <span className="text-sm text-muted-foreground">
              / Ref: {benchmark} {unit}
            </span>
          </div>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#094016]">Diagnóstico Inicial</h1>
          <p className="text-muted-foreground">
            Avalie a performance e viabilidade da fazenda frente ao mercado.
          </p>
        </div>
        <Target className="w-10 h-10 text-[#094016] opacity-80" />
      </div>

      <Tabs defaultValue="novo">
        <TabsList className="mb-4">
          <TabsTrigger value="novo">Novo Diagnóstico</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="novo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entrada de Dados (Anual)</CardTitle>
              <CardDescription>Insira os dados base da fazenda para gerar os KPIs.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div className="space-y-2">
                  <Label>Tamanho da Fazenda (ha)</Label>
                  <Input
                    name="tamanho_ha"
                    type="number"
                    step="0.01"
                    value={formData.tamanho_ha}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total de Animais (Cabeças)</Label>
                  <Input
                    name="total_animais"
                    type="number"
                    value={formData.total_animais}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrobas Produzidas</Label>
                  <Input
                    name="arrobas_produzidas"
                    type="number"
                    step="0.01"
                    value={formData.arrobas_produzidas}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custos Totais (R$)</Label>
                  <Input
                    name="custos"
                    type="number"
                    step="0.01"
                    value={formData.custos}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receitas Totais (R$)</Label>
                  <Input
                    name="receitas"
                    type="number"
                    step="0.01"
                    value={formData.receitas}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full bg-[#094016] hover:bg-[#094016]/90"
                    disabled={loading}
                  >
                    Gerar Diagnóstico
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {resultado && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-semibold">Relatório de Benchmarking</h2>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>Análise Automática</AlertTitle>
                <AlertDescription>
                  Comparativo do seu resultado com referências de fazendas altamente produtivas (Top
                  10%).
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderBenchmark('Custo por @', resultado.custo_arroba!, 220, false, 'R$/@')}
                {renderBenchmark('Lotação', resultado.lotacao!, 1.5, true, 'UA/ha')}
                {renderBenchmark('Produtividade', resultado.produtividade_ha!, 15, true, '@/ha')}
                {renderBenchmark('Margem de Lucro', resultado.margem_lucro!, 20, true, '%')}
                {renderBenchmark('ROI', resultado.roi!, 15, true, '%')}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum diagnóstico registrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {historico.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{new Date(h.created).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          ROI: {h.roi.toFixed(2)}% | Produtividade: {h.produtividade_ha.toFixed(2)}{' '}
                          @/ha
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Custo @: R$ {h.custo_arroba.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Margem: {h.margem_lucro.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
