import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Printer,
  Filter,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { exportFechamentoEconomicoPDF } from '@/lib/pdf-fechamento'

interface LoteFechamento {
  id: string
  nome_lote: string
  status: string
  centro_custo: string
  quantidade_cabecas: number
  peso_entrada_total: number
  peso_atual_total: number
  ganho_peso_total: number
  arrobas_produzidas: number
  gmd_medio: number
  consumo_total_racao: number
  custo_nutricao: number
  despesas_diretas: number
  custo_total: number
  receita_total: number
  custo_por_arroba: number
  receita_por_arroba: number
  margem_bruta: number
  margem_por_cabeca: number
}

export default function FechamentoEconomico() {
  const [data, setData] = useState<LoteFechamento[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ccFilter, setCcFilter] = useState<string>('all')
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      let query = '?'
      if (statusFilter !== 'all') query += `status=${statusFilter}&`
      if (ccFilter !== 'all') query += `centro_custo=${ccFilter}&`

      const res = await pb.send(`/backend/v1/fechamento-economico${query}`, { method: 'GET' })
      setData(res || [])
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: err.message || 'Falha na conexão com o servidor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter, ccFilter])

  const handleExportPDF = async () => {
    try {
      await exportFechamentoEconomicoPDF(data, { statusFilter, ccFilter })
      toast({
        title: 'Relatório Gerado',
        description: 'O PDF foi gerado e aberto para impressão.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const fmtCurrency = (v: number) =>
    (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtNum = (v: number) =>
    (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totais = data.reduce(
    (acc, lote) => {
      acc.receita += lote.receita_total
      acc.custo += lote.custo_total
      acc.margem += lote.margem_bruta
      acc.cabecas += lote.quantidade_cabecas
      acc.arrobas += lote.arrobas_produzidas
      return acc
    },
    { receita: 0, custo: 0, margem: 0, cabecas: 0, arrobas: 0 },
  )

  const mediaCustoArroba = totais.arrobas > 0 ? totais.custo / totais.arrobas : 0
  const mediaMargemCabeca = totais.cabecas > 0 ? totais.margem / totais.cabecas : 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">
            Fechamento Econômico
          </h1>
          <p className="text-gray-500 mt-1">Rentabilidade por Ciclo e Lote</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportPDF}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
          </Button>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-emerald-100">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Status do Lote
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Finalizado">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-800">Centro de Custo</label>
            <Select value={ccFilter} onValueChange={setCcFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CC01-Nelore PO">CC01-Nelore PO</SelectItem>
                <SelectItem value="CC02-Comercial TIP">CC02-Comercial TIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Custo Total (Filtrado)</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totais.custo)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {fmtCurrency(totais.receita)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Margem Global</p>
                <p
                  className={`text-2xl font-bold mt-1 ${totais.margem >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {fmtCurrency(totais.margem)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo Médio / @</span>
                <span className="font-semibold">{fmtCurrency(mediaCustoArroba)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">Margem / Cabeça</span>
                <span className="font-semibold">{fmtCurrency(mediaMargemCabeca)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">Total @ Prod.</span>
                <span className="font-semibold">{fmtNum(totais.arrobas)} @</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fechamento por Lote</CardTitle>
          <CardDescription>
            Detalhamento de indicadores econômicos e zootécnicos por lote do período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              Nenhum lote encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-emerald-50">
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cab.</TableHead>
                    <TableHead className="text-right">GMD Médio</TableHead>
                    <TableHead className="text-right">@ Prod.</TableHead>
                    <TableHead className="text-right">Custo / @</TableHead>
                    <TableHead className="text-right">Margem / Cab.</TableHead>
                    <TableHead className="text-right">Margem Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((lote) => (
                    <TableRow key={lote.id} className="hover:bg-emerald-50/50 transition-colors">
                      <TableCell className="font-medium text-emerald-900">
                        {lote.nome_lote}
                        <br />
                        <span className="text-xs text-gray-500 font-normal">
                          {lote.centro_custo || 'S/ CC'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={lote.status === 'Finalizado' ? 'secondary' : 'default'}
                          className={
                            lote.status === 'Finalizado'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }
                        >
                          {lote.status || 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{lote.quantidade_cabecas}</TableCell>
                      <TableCell className="text-right">
                        {lote.gmd_medio > 0 ? (
                          `${lote.gmd_medio.toFixed(3)} kg`
                        ) : (
                          <span className="text-gray-400 text-xs">Sem Dados</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtNum(lote.arrobas_produzidas)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {lote.custo_por_arroba > 0 ? (
                          fmtCurrency(lote.custo_por_arroba)
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {lote.margem_por_cabeca !== 0 ? (
                          <span
                            className={
                              lote.margem_por_cabeca >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }
                          >
                            {fmtCurrency(lote.margem_por_cabeca)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span
                          className={lote.margem_bruta >= 0 ? 'text-emerald-700' : 'text-red-600'}
                        >
                          {fmtCurrency(lote.margem_bruta)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
