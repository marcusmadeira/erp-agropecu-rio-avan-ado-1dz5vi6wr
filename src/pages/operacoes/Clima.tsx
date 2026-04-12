import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CloudRain, Droplets, Sun, Trash2 } from 'lucide-react'
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
  ComposedChart,
  Line,
} from 'recharts'
import { useToast } from '@/components/ui/use-toast'
import { getChuvas, createChuva, deleteChuva } from '@/services/clima'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Clima() {
  const [chuvas, setChuvas] = useState<any[]>([])
  const [correlations, setCorrelations] = useState<any[]>([])
  const [formData, setFormData] = useState({ data_chuva: '', quantidade_mm: '', observacoes: '' })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getChuvas()
      setChuvas(data)

      const lastYear = subMonths(new Date(), 12).toISOString().split('T')[0]
      const [pesagens, iatf, racao] = await Promise.all([
        pb.collection('pesagens_diarias').getFullList({ filter: `data_pesagem >= "${lastYear}"` }),
        pb.collection('manejo_iatf_curral').getFullList({ filter: `data_iatf >= "${lastYear}"` }),
        pb.collection('producao_diaria_racao').getFullList({ filter: `data >= "${lastYear}"` }),
      ])

      const monthsMap = new Map()
      for (let i = 11; i >= 0; i--) {
        const m = startOfMonth(subMonths(new Date(), i))
        monthsMap.set(m.getTime(), {
          month: format(m, 'MMM/yy', { locale: ptBR }),
          timestamp: m.getTime(),
          chuva: 0,
          gmd: 0,
          prenhez: 0,
          custo_racao: 0,
          pesagens_count: 0,
          iatf_total: 0,
          iatf_prenhe: 0,
        })
      }

      data.forEach((c) => {
        const d = startOfMonth(parseISO(c.data_chuva)).getTime()
        if (monthsMap.has(d)) monthsMap.get(d).chuva += c.quantidade_mm
      })

      pesagens.forEach((p) => {
        const d = startOfMonth(parseISO(p.data_pesagem)).getTime()
        if (monthsMap.has(d) && p.gmd_calculado) {
          monthsMap.get(d).gmd += p.gmd_calculado
          monthsMap.get(d).pesagens_count++
        }
      })

      iatf.forEach((i) => {
        const d = startOfMonth(parseISO(i.data_iatf)).getTime()
        if (monthsMap.has(d)) {
          monthsMap.get(d).iatf_total++
          if (i.resultado_dg === 'Prenhe') monthsMap.get(d).iatf_prenhe++
        }
      })

      racao.forEach((r) => {
        const d = startOfMonth(parseISO(r.data)).getTime()
        if (monthsMap.has(d) && r.custo_total) {
          monthsMap.get(d).custo_racao += r.custo_total
        }
      })

      const finalCorrelations = Array.from(monthsMap.values()).map((m) => ({
        month: m.month,
        chuva: m.chuva,
        gmd: m.pesagens_count ? +(m.gmd / m.pesagens_count).toFixed(2) : 0,
        prenhez: m.iatf_total ? +((m.iatf_prenhe / m.iatf_total) * 100).toFixed(1) : 0,
        custo_racao: m.custo_racao,
      }))

      setCorrelations(finalCorrelations)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('registro_chuvas', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createChuva({
        data_chuva: new Date(formData.data_chuva).toISOString(),
        quantidade_mm: Number(formData.quantidade_mm),
        observacoes: formData.observacoes,
      })
      toast({ title: 'Sucesso', description: 'Registro de chuva adicionado.' })
      setFormData({ data_chuva: '', quantidade_mm: '', observacoes: '' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await deleteChuva(id)
        toast({ title: 'Sucesso', description: 'Registro excluído.' })
      } catch {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  const stats = useMemo(() => {
    const currentMonth = new Date()
    let totalCurrent = 0
    const monthlyTotals = new Map<string, number>()

    chuvas.forEach((c) => {
      const d = parseISO(c.data_chuva)
      if (isSameMonth(d, currentMonth)) totalCurrent += c.quantidade_mm

      const mKey = format(d, 'yyyy-MM')
      monthlyTotals.set(mKey, (monthlyTotals.get(mKey) || 0) + c.quantidade_mm)
    })

    let maxMonth = { key: '-', val: -1 }
    let minMonth = { key: '-', val: Infinity }
    monthlyTotals.forEach((val, key) => {
      if (val > maxMonth.val) maxMonth = { key, val }
      if (val < minMonth.val) minMonth = { key, val }
    })

    return {
      totalCurrent,
      maxMonth:
        maxMonth.val === -1
          ? '-'
          : `${format(parseISO(maxMonth.key + '-01'), 'MMM/yyyy', { locale: ptBR })} (${maxMonth.val}mm)`,
      minMonth:
        minMonth.val === Infinity
          ? '-'
          : `${format(parseISO(minMonth.key + '-01'), 'MMM/yyyy', { locale: ptBR })} (${minMonth.val}mm)`,
    }
  }, [chuvas])

  const chartConfig = {
    chuva: { label: 'Chuva (mm)', color: 'hsl(var(--primary))' },
    gmd: { label: 'GMD (kg)', color: '#f59e0b' },
    prenhez: { label: 'Prenhez (%)', color: '#ec4899' },
    custo_racao: { label: 'Custo Ração (R$)', color: '#ef4444' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#094016]">
            Monitorização de Clima
          </h2>
          <p className="text-muted-foreground">
            Registre o índice pluviométrico e analise correlações com a produção.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chuva no Mês Atual</CardTitle>
            <CloudRain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCurrent.toFixed(1)} mm</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mês Mais Chuvoso (12m)</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.maxMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mês Mais Seco (12m)</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.minMonth}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Registrar Chuva</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Data da Chuva</Label>
                <Input
                  type="date"
                  required
                  value={formData.data_chuva}
                  onChange={(e) => setFormData({ ...formData, data_chuva: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={formData.quantidade_mm}
                  onChange={(e) => setFormData({ ...formData, quantidade_mm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-[#094016] hover:bg-[#094016]/90">
                Salvar Registro
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Chuvas (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={correlations}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="chuva" fill="var(--color-chuva)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Correlação: Clima vs Produção</CardTitle>
          <CardDescription>
            Impacto das chuvas no GMD, Taxa de Prenhez e Custo de Alimentação
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={correlations}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="chuva"
                  fill="var(--color-chuva)"
                  opacity={0.3}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="gmd"
                  stroke="var(--color-gmd)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="prenhez"
                  stroke="var(--color-prenhez)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="custo_racao"
                  stroke="var(--color-custo_racao)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Quantidade (mm)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chuvas.slice(0, 10).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{format(parseISO(c.data_chuva), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{c.quantidade_mm}</TableCell>
                  <TableCell>{c.observacoes}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {chuvas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
