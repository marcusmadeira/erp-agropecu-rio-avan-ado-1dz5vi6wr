import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, Search, Eye, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO, subDays } from 'date-fns'
import { getAuditoriasPaginated, AuditoriaMovimentacao } from '@/services/auditoria'
import pb from '@/lib/pocketbase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useRealtime } from '@/hooks/use-realtime'

const JsonDisplay = ({ dataStr }: { dataStr?: string }) => {
  if (!dataStr) return <span className="text-muted-foreground italic">Vazio</span>
  try {
    const obj = JSON.parse(dataStr)
    return (
      <pre className="text-xs bg-slate-950 text-slate-50 p-3 rounded-md overflow-x-auto border border-slate-800 shadow-inner">
        {JSON.stringify(obj, null, 2)}
      </pre>
    )
  } catch (e) {
    return <p className="text-sm bg-slate-100 p-2 rounded">{dataStr}</p>
  }
}

export default function Auditoria() {
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [perPage] = useState(15)
  const [data, setData] = useState<{
    items: AuditoriaMovimentacao[]
    totalItems: number
    totalPages: number
  }>({ items: [], totalItems: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [actionType, setActionType] = useState('all')
  const [tableName, setTableName] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const filterArr = []

      if (userEmail) filterArr.push(`user_email ~ '${userEmail}'`)
      if (actionType !== 'all') filterArr.push(`tipo_acao = '${actionType}'`)
      if (tableName !== 'all') filterArr.push(`tabela_afetada = '${tableName}'`)
      if (statusFilter !== 'all') filterArr.push(`status = '${statusFilter}'`)

      if (searchTerm) {
        filterArr.push(`(registro_id ~ '${searchTerm}' || description ~ '${searchTerm}')`)
      }

      if (dateFrom) filterArr.push(`created >= '${dateFrom} 00:00:00.000Z'`)
      if (dateTo) filterArr.push(`created <= '${dateTo} 23:59:59.999Z'`)

      const filterStr = filterArr.join(' && ')

      const result = await getAuditoriasPaginated(page, perPage, { filter: filterStr })
      setData({ items: result.items, totalItems: result.totalItems, totalPages: result.totalPages })

      // 30 days activity chart
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
      const chartResult = await pb.collection('auditoria_movimentacoes').getFullList({
        filter: `created >= '${thirtyDaysAgo}'`,
        sort: 'created',
        fields: 'created',
      })

      const groupedByDate = chartResult.reduce((acc: any, curr: any) => {
        const d = curr.created.split(' ')[0]
        acc[d] = (acc[d] || 0) + 1
        return acc
      }, {})

      const cData = Object.keys(groupedByDate)
        .sort()
        .map((d) => ({ date: d.substring(5, 10), events: groupedByDate[d] }))
      setChartData(cData)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar auditorias.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, userEmail, actionType, tableName, statusFilter, searchTerm, dateFrom, dateTo])
  useRealtime('auditoria_movimentacoes', () => {
    loadData()
  })

  const getActionColor = (action: string) => {
    if (action === 'CREATE' || action === 'Criação') return 'bg-emerald-100 text-emerald-800'
    if (action === 'UPDATE' || action === 'Edição') return 'bg-amber-100 text-amber-800'
    if (action === 'DELETE' || action === 'Exclusão') return 'bg-rose-100 text-rose-800'
    if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-blue-100 text-blue-800'
    return 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Visibilidade total das ações e acessos no ERP
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-t-4 border-t-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-500" /> Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Usuário (Email)</label>
                  <Input
                    placeholder="usuario@exemplo..."
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value)
                      setPage(1)
                    }}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ação</label>
                  <Select
                    value={actionType}
                    onValueChange={(v) => {
                      setActionType(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="CREATE">CREATE</SelectItem>
                      <SelectItem value="UPDATE">UPDATE</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="LOGIN">LOGIN</SelectItem>
                      <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="SUCCESS">Sucesso</SelectItem>
                      <SelectItem value="FAILED">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Data Inicial</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setPage(1)
                    }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Data Final</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setPage(1)
                    }}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Buscar por ID ou descrição..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUserEmail('')
                    setActionType('all')
                    setTableName('all')
                    setStatusFilter('all')
                    setDateFrom('')
                    setDateTo('')
                    setSearchTerm('')
                    setPage(1)
                  }}
                  className="text-xs h-9"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Data/Hora</TableHead>
                    <TableHead className="font-semibold text-slate-700">Usuário</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ação</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tabela/Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">
                      Detalhes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap text-slate-500">
                          {format(parseISO(log.created), 'dd/MM/yy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-slate-900">
                              {log.user_email || log.expand?.usuario_id?.email || 'Sistema'}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">
                              {log.user_role || 'Auto'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getActionColor(log.tipo_acao)}`}
                          >
                            {log.tipo_acao}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{log.tabela_afetada}</span>
                            <span
                              className={`text-[10px] font-bold ${log.status === 'SUCCESS' ? 'text-emerald-600' : log.status === 'FAILED' ? 'text-rose-600' : 'text-slate-500'}`}
                            >
                              {log.status || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs shadow-sm">
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-slate-50 p-0">
                              <DialogHeader className="p-6 pb-4 bg-white border-b">
                                <DialogTitle className="text-xl flex items-center gap-2">
                                  <ShieldCheck className="w-6 h-6 text-blue-600" /> Detalhes do Log
                                </DialogTitle>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm bg-slate-100 p-4 rounded-lg">
                                  <div>
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      Usuário
                                    </strong>{' '}
                                    {log.user_email || log.expand?.usuario_id?.email || 'N/A'}
                                  </div>
                                  <div>
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      Endereço IP
                                    </strong>{' '}
                                    {log.ip_address || 'N/A'}
                                  </div>
                                  <div>
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      Ação
                                    </strong>{' '}
                                    {log.tipo_acao}
                                  </div>
                                  <div>
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      Status
                                    </strong>{' '}
                                    {log.status || 'N/A'}
                                  </div>
                                  <div className="col-span-2">
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      Descrição
                                    </strong>{' '}
                                    {log.description || 'N/A'}
                                  </div>
                                  <div className="col-span-2">
                                    <strong className="block text-slate-500 text-xs uppercase mb-1">
                                      ID Afetado
                                    </strong>{' '}
                                    {log.registro_id || 'N/A'}
                                  </div>
                                </div>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto p-6">
                                {log.tipo_acao === 'LOGIN' || log.tipo_acao === 'LOGOUT' ? (
                                  <div className="text-center py-8 text-slate-500">
                                    Log de sessão. Não há alterações de dados atreladas.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-sm mb-3 text-rose-800 flex items-center gap-2 border-b pb-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>{' '}
                                        Valores Anteriores
                                      </h4>
                                      <JsonDisplay dataStr={log.dados_anteriores} />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center gap-2 border-b pb-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>{' '}
                                        Valores Novos
                                      </h4>
                                      <JsonDisplay dataStr={log.dados_novos} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50/50">
              <p className="text-sm text-slate-500">
                Página {page} de {Math.max(1, data.totalPages)} | Total: {data.totalItems}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md border-t-4 border-t-[#1e3a8a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1e3a8a]" /> Atividade (30 Dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                  Sem dados recentes
                </div>
              ) : (
                <div className="h-[250px] w-full mt-4">
                  <ChartContainer
                    config={{ events: { label: 'Eventos', color: '#1e3a8a' } }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="events"
                          stroke="var(--color-events)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
