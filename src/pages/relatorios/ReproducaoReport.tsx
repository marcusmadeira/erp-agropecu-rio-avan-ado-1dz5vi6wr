import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getIatfs, ManejoIatf } from '@/services/manejo_iatf'
import { getNascimentos, NascimentoDesmama } from '@/services/nascimentos'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Activity, Baby, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function ReproducaoReport() {
  const { user } = useAuth()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [iatfs, setIatfs] = useState<ManejoIatf[]>([])
  const [nascimentos, setNascimentos] = useState<NascimentoDesmama[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const iFilters = [],
          nFilters = []
        if (dateFrom) {
          iFilters.push(`data_iatf >= "${dateFrom} 00:00:00"`)
          nFilters.push(`data_nascimento >= "${dateFrom} 00:00:00"`)
        }
        if (dateTo) {
          iFilters.push(`data_iatf <= "${dateTo} 23:59:59"`)
          nFilters.push(`data_nascimento <= "${dateTo} 23:59:59"`)
        }

        const [resIatf, resNasc] = await Promise.all([
          getIatfs(iFilters.length ? { filter: iFilters.join(' && ') } : undefined),
          getNascimentos(nFilters.length ? { filter: nFilters.join(' && ') } : undefined),
        ])
        setIatfs(resIatf)
        setNascimentos(resNasc)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateFrom, dateTo])

  const metrics = useMemo(() => {
    const comDg = iatfs.filter((i) => i.resultado_dg)
    const prenhes = comDg.filter((i) => i.resultado_dg === 'Prenhe').length
    const taxaPrenhez = comDg.length > 0 ? (prenhes / comDg.length) * 100 : 0
    const mortos = nascimentos.filter((n) => {
      const s = (n.status_cria || '').toLowerCase()
      return s.includes('mort') || s.includes('óbito')
    }).length
    const taxaMort = nascimentos.length > 0 ? (mortos / nascimentos.length) * 100 : 0

    return {
      taxaPrenhez: taxaPrenhez.toFixed(1),
      totalNascimentos: nascimentos.length,
      taxaMort: taxaMort.toFixed(1),
      prenhes,
      vazias: comDg.length - prenhes,
    }
  }, [iatfs, nascimentos])

  const exportColumns = [
    { header: 'Métrica', dataKey: 'metrica' },
    { header: 'Valor', dataKey: 'valor' },
  ]

  const exportData = [
    { metrica: 'Taxa de Prenhez', valor: `${metrics.taxaPrenhez}%` },
    { metrica: 'Total de Diagnósticos', valor: metrics.prenhes + metrics.vazias },
    { metrica: 'Prenhes', valor: metrics.prenhes },
    { metrica: 'Vazias', valor: metrics.vazias },
    { metrica: 'Nascimentos Registrados', valor: metrics.totalNascimentos },
    { metrica: 'Taxa de Mortalidade Bezerros', valor: `${metrics.taxaMort}%` },
  ]

  const pieData = [
    { name: 'Prenhe', value: metrics.prenhes, fill: '#0f172a' },
    { name: 'Vazia', value: metrics.vazias, fill: '#cbd5e1' },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Filtros de Reprodução</CardTitle>
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Relatório de Reprodução',
                data: exportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Relatório de Reprodução',
                data: exportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <Activity className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                    Taxa de Prenhez
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{metrics.taxaPrenhez}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                <Baby className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                    Nascimentos Registrados
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {metrics.totalNascimentos}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-rose-50 shadow-sm border-rose-200">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
                <div>
                  <p className="text-sm text-rose-700 font-medium uppercase tracking-wider">
                    Mortalidade Bezerros
                  </p>
                  <p className="text-3xl font-bold text-rose-700 mt-1">{metrics.taxaMort}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg">
                Eficiência Reprodutiva (Diagnóstico de Gestação)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-center">
              {metrics.prenhes + metrics.vazias > 0 ? (
                <ChartContainer
                  config={{
                    prenhe: { label: 'Prenhe', color: '#0f172a' },
                    vazia: { label: 'Vazia', color: '#cbd5e1' },
                  }}
                  className="h-[300px] w-full max-w-[400px]"
                >
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Nenhum diagnóstico de gestação encontrado no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
