import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, Box, Activity } from 'lucide-react'

export function RebanhoTab({ animais }: { animais: any[] }) {
  const totalAnimais = animais.length

  const animaisPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {
      'Matriz PO': 0,
      'Touro PO': 0,
      Bezerro: 0,
      'Novilha TIP': 0,
      'Garrote TIP': 0,
    }
    animais.forEach((a) => {
      if (counts[a.categoria] !== undefined) counts[a.categoria]++
    })
    return counts
  }, [animais])

  const pesoMedio = useMemo(() => {
    if (totalAnimais === 0) return 0
    const sum = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0), 0)
    return (sum / totalAnimais).toFixed(2)
  }, [animais, totalAnimais])

  const chartDataLotes = useMemo(() => {
    const lotes: Record<string, number> = {}
    animais.forEach((a) => {
      const loteName = a.expand?.lote_atual?.nome_lote || 'Sem Lote'
      lotes[loteName] = (lotes[loteName] || 0) + 1
    })
    return Object.entries(lotes).map(([name, total]) => ({ name, total }))
  }, [animais])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#0f172a]">Total de Animais</CardTitle>
            <Activity className="h-4 w-4 text-[#0f172a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0f172a]">{totalAnimais}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#0f172a]">Peso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#0f172a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0f172a]">
              {pesoMedio} <span className="text-sm font-normal text-muted-foreground">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#0f172a]">
              Animais por Categoria
            </CardTitle>
            <Box className="h-4 w-4 text-[#0f172a]" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium space-y-1 text-[#0f172a]">
              {Object.entries(animaisPorCategoria).map(([cat, count]) => (
                <div key={cat} className="flex justify-between">
                  <span>{cat}:</span> <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#0f172a]">Animais por Lote</CardTitle>
            <CardDescription>Distribuição do rebanho</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{ total: { label: 'Animais', color: '#0f172a' } }}
              className="w-full h-full"
            >
              <BarChart data={chartDataLotes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 flex flex-col">
          <CardHeader>
            <CardTitle className="text-[#0f172a]">Últimos Registros</CardTitle>
            <CardDescription>10 registros mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#0f172a]">Brinco</TableHead>
                  <TableHead className="text-[#0f172a]">Categoria</TableHead>
                  <TableHead className="text-[#0f172a] text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animais.slice(0, 10).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.id_manejo_brinco}</TableCell>
                    <TableCell>{a.categoria}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(a.created), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {animais.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Sem dados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
