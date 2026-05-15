import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CloudRain, Map as MapIcon, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { useToast } from '@/components/ui/use-toast'
import { getChuvas, createChuva, deleteChuva } from '@/services/clima'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Clima() {
  const [chuvas, setChuvas] = useState<any[]>([])
  const [pastos, setPastos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    data_chuva: new Date().toISOString().split('T')[0],
    quantidade_mm: '',
    observacoes: '',
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [chuvaData, pastoData] = await Promise.all([
        getChuvas(),
        pb.collection('pastos_e_piquetes').getFullList(),
      ])
      setChuvas(chuvaData)
      setPastos(pastoData)
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do clima.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('registro_chuvas', loadData)
  useRealtime('pastos_e_piquetes', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createChuva({
        data_chuva: new Date(formData.data_chuva).toISOString(),
        quantidade_mm: Number(formData.quantidade_mm),
        observacoes: formData.observacoes,
      })
      toast({ title: 'Sucesso', description: 'Registro de chuva adicionado.' })
      setFormData({
        data_chuva: new Date().toISOString().split('T')[0],
        quantidade_mm: '',
        observacoes: '',
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar chuva.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    try {
      await deleteChuva(id)
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  // 7-day rainfall history
  const recentRainChartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dStr = format(d, 'yyyy-MM-dd')
      const totalMm = chuvas
        .filter((c) => c.data_chuva.startsWith(dStr))
        .reduce((acc, c) => acc + c.quantidade_mm, 0)

      days.push({
        date: format(d, 'dd/MMM', { locale: ptBR }),
        chuva: totalMm,
      })
    }
    return days
  }, [chuvas])

  const total7Days = recentRainChartData.reduce((acc, d) => acc + d.chuva, 0)

  const pastosChartData = useMemo(() => {
    return pastos
      .filter((p) => p.altura_capim_cm > 0)
      .map((p) => ({
        nome: p.nome_piquete || p.nome,
        altura: p.altura_capim_cm,
        minima: p.altura_minima_saida_cm || 0,
      }))
      .slice(0, 10) // show top 10
  }, [pastos])

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#094016]">Operacional de Clima</h2>
          <p className="text-muted-foreground">
            Acompanhe o regime de chuvas e as condições de pastagem da fazenda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acumulado 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <CloudRain className="w-10 h-10 text-blue-500" />
                <div className="text-4xl font-bold text-[#094016]">
                  {total7Days.toFixed(1)} <span className="text-xl">mm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrar Precipitação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    required
                    value={formData.data_chuva}
                    onChange={(e) => setFormData({ ...formData, data_chuva: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume (mm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantidade_mm}
                    onChange={(e) => setFormData({ ...formData, quantidade_mm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações (Opcional)</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#094016] hover:bg-[#094016]/90"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Registro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Chuvas (Últimos 7 Dias)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ChartContainer
                config={{ chuva: { label: 'Chuva (mm)', color: '#3b82f6' } }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recentRainChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="chuva" fill="var(--color-chuva)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-emerald-600" />
                Situação das Pastagens
              </CardTitle>
              <CardDescription>Altura atual vs Altura mínima de saída (Amostragem)</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              {pastosChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    altura: { label: 'Altura Atual (cm)', color: '#10b981' },
                    minima: { label: 'Mínima de Saída (cm)', color: '#ef4444' },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={pastosChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nome"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="altura"
                        stroke="var(--color-altura)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="minima"
                        stroke="var(--color-minima)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Nenhuma leitura de altura de capim registrada.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Registros Pluviométricos</CardTitle>
        </CardHeader>
        <CardContent>
          {chuvas.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum registro encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Volume (mm)</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chuvas.slice(0, 10).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{format(parseISO(c.data_chuva), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{c.quantidade_mm} mm</TableCell>
                    <TableCell>{c.observacoes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
