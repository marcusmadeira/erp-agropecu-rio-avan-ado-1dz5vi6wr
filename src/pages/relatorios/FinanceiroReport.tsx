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
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTransacoesFinanceiras, TransacaoFinanceira } from '@/services/transacoes_financeiras'
import { exportFinancialReportPDF } from '@/lib/pdf'
import { Download, Loader2 } from 'lucide-react'

export default function FinanceiroReport() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [classificacao, setClassificacao] = useState('Todas')
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const filters: string[] = []
        if (dateFrom) filters.push(`data_competencia >= "${dateFrom} 00:00:00"`)
        if (dateTo) filters.push(`data_competencia <= "${dateTo} 23:59:59"`)
        if (tipo !== 'Todos') filters.push(`tipo_movimento = "${tipo}"`)
        if (classificacao !== 'Todas') filters.push(`classificacao_custo = "${classificacao}"`)

        const res = await getTransacoesFinanceiras({ filter: filters.join(' && ') })
        setTransacoes(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dateFrom, dateTo, tipo, classificacao])

  const groupedData = useMemo(() => {
    return transacoes.reduce(
      (acc, t) => {
        const cc = t.centro_custo || 'Sem Centro de Custo'
        acc[cc] = (acc[cc] || 0) + t.valor_total
        return acc
      },
      {} as Record<string, number>,
    )
  }, [transacoes])

  const handleExport = () => {
    exportFinancialReportPDF(groupedData, { dateFrom, dateTo, tipo, classificacao })
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg text-slate-800">Filtros Financeiros</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Data Inicial</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Data Final</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de Movimento</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Classificação</label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="VARIÁVEL">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg text-slate-800">Resumo por Centro de Custo</CardTitle>
          <Button
            onClick={handleExport}
            className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={Object.keys(groupedData).length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold text-slate-700">Centro de Custo</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">
                    Valor Total Consolidado (R$)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedData).length > 0 ? (
                  Object.entries(groupedData).map(([cc, total]) => (
                    <TableRow key={cc}>
                      <TableCell className="font-medium">{cc}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                      Nenhuma transação encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
