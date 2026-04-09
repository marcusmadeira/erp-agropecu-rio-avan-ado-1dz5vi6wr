import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getLotes } from '@/services/lotes'
import { getAnimais } from '@/services/animais'
import { getPesagens, PesagemDiaria } from '@/services/pesagens'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Scale, TrendingUp, Users, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function DesempenhoReport() {
  const { user } = useAuth()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loteId, setLoteId] = useState('Todos')
  const [lotes, setLotes] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [pesagens, setPesagens] = useState<PesagemDiaria[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLotes().then(setLotes)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const animalFilters = []
        if (loteId !== 'Todos') animalFilters.push(`lote_atual = "${loteId}"`)
        const animaisRes = await getAnimais(
          animalFilters.length ? { filter: animalFilters.join(' && ') } : undefined,
        )
        setAnimais(animaisRes)

        const pesagemFilters = []
        if (dateFrom) pesagemFilters.push(`data_pesagem >= "${dateFrom} 00:00:00"`)
        if (dateTo) pesagemFilters.push(`data_pesagem <= "${dateTo} 23:59:59"`)
        const pesagensRes = await getPesagens(
          pesagemFilters.length ? { filter: pesagemFilters.join(' && ') } : undefined,
        )

        const animalIds = new Set(animaisRes.map((a: any) => a.id))
        setPesagens(pesagensRes.filter((p: any) => animalIds.has(p.animal_id)))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateFrom, dateTo, loteId])

  const metrics = useMemo(() => {
    let totalGmd = 0,
      gmdCount = 0
    let totalPeso = 0,
      pesoCount = 0

    const byAnimal = pesagens.reduce(
      (acc, p) => {
        if (!acc[p.animal_id]) acc[p.animal_id] = []
        acc[p.animal_id].push(p)
        return acc
      },
      {} as Record<string, PesagemDiaria[]>,
    )

    Object.values(byAnimal).forEach((list) => {
      list.sort((a, b) => a.data_pesagem.localeCompare(b.data_pesagem))
      totalPeso += list[list.length - 1].peso_kg
      pesoCount++

      if (list.length > 1) {
        const first = list[0],
          last = list[list.length - 1]
        const days =
          (new Date(last.data_pesagem).getTime() - new Date(first.data_pesagem).getTime()) /
          (1000 * 3600 * 24)
        if (days > 0) {
          totalGmd += (last.peso_kg - first.peso_kg) / days
          gmdCount++
        }
      }
    })

    return {
      qtd: animais.length,
      pesoMedio: pesoCount > 0 ? (totalPeso / pesoCount).toFixed(1) : '0.0',
      gmd: gmdCount > 0 ? (totalGmd / gmdCount).toFixed(3) : '0.000',
    }
  }, [animais, pesagens])

  const exportColumns = [
    { header: 'Animal', dataKey: 'brinco' },
    { header: 'Categoria', dataKey: 'categoria' },
    { header: 'Peso Atual (kg)', dataKey: (r: any) => r.peso.toFixed(1) },
    { header: 'GMD (kg/dia)', dataKey: (r: any) => r.gmd.toFixed(3) },
  ]

  const exportData = useMemo(() => {
    return animais.map((a) => {
      const p = pesagens
        .filter((pes) => pes.animal_id === a.id)
        .sort((x, y) => x.data_pesagem.localeCompare(y.data_pesagem))
      let gmd = 0
      let avgWeight = p.length > 0 ? p[p.length - 1].peso_kg : 0
      if (p.length > 1) {
        const first = p[0]
        const last = p[p.length - 1]
        const days =
          (new Date(last.data_pesagem).getTime() - new Date(first.data_pesagem).getTime()) /
          (1000 * 3600 * 24)
        if (days > 0) gmd = (last.peso_kg - first.peso_kg) / days
      }
      return {
        brinco: a.id_manejo_brinco,
        categoria: a.categoria,
        peso: avgWeight,
        gmd: gmd,
      }
    })
  }, [animais, pesagens])

  const chartData = useMemo(() => {
    const grouped = pesagens.reduce(
      (acc, p) => {
        const d = p.data_pesagem.split(' ')[0]
        if (!acc[d]) acc[d] = []
        acc[d].push(p.peso_kg)
        return acc
      },
      {} as Record<string, number[]>,
    )

    return Object.entries(grouped)
      .map(([date, w]) => ({
        date,
        peso: w.reduce((a, b) => a + b, 0) / w.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [pesagens])

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Filtros de Desempenho</CardTitle>
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Relatório de Desempenho',
                data: exportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Relatório de Desempenho',
                data: exportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Lote</label>
            <Select value={loteId} onValueChange={setLoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Lotes</SelectItem>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Data Inicial</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Data Final</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 text-white shadow-md border-0">
              <CardContent className="p-6 flex items-center gap-4">
                <Users className="w-10 h-10 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-300 font-medium uppercase tracking-wider">
                    Total de Animais
                  </p>
                  <p className="text-3xl font-bold mt-1">{metrics.qtd}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <Scale className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                    Peso Médio Atual
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{metrics.pesoMedio} kg</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <TrendingUp className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                    GMD Médio
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{metrics.gmd} kg/dia</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg">Evolução do Peso Médio (kg)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{ peso: { label: 'Peso', color: '#0f172a' } }}
                  className="h-[300px] w-full"
                >
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="var(--color-peso)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--color-peso)' }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Dados insuficientes para gerar o gráfico no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
