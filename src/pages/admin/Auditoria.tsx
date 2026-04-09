import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { format, parseISO } from 'date-fns'
import { getAuditoriasPaginated, AuditoriaMovimentacao } from '@/services/auditoria'
import pb from '@/lib/pocketbase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

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
  const { user } = useAuth()
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
  const [userId, setUserId] = useState('all')
  const [actionType, setActionType] = useState('all')
  const [tableName, setTableName] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [users, setUsers] = useState<any[]>([])

  const systemTables = [
    'users',
    'conversas_ia',
    'parceiros_negocios',
    'lotes',
    'animais',
    'estoque_insumos',
    'transacoes_financeiras',
    'estoque_semen',
    'planejamento_acasalamento',
    'manejo_iatf_curral',
    'nascimentos_e_desmama',
    'pesagens_diarias',
    'auditoria_movimentacoes',
    'logs_sistema',
    'notificacoes',
  ]

  useEffect(() => {
    pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const filterArr = []

      if (userId !== 'all') filterArr.push(`usuario_id = '${userId}'`)
      if (actionType !== 'all') filterArr.push(`tipo_acao = '${actionType}'`)
      if (tableName !== 'all') filterArr.push(`tabela_afetada = '${tableName}'`)

      if (searchTerm) {
        filterArr.push(`(registro_id ~ '${searchTerm}' || tabela_afetada ~ '${searchTerm}')`)
      }

      if (dateFrom) filterArr.push(`created >= '${dateFrom} 00:00:00.000Z'`)
      if (dateTo) filterArr.push(`created <= '${dateTo} 23:59:59.999Z'`)

      const filterStr = filterArr.join(' && ')

      const result = await getAuditoriasPaginated(page, perPage, {
        filter: filterStr,
      })

      setData({
        items: result.items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      })

      const chartResult = await pb.collection('auditoria_movimentacoes').getFullList({
        filter: filterStr,
        expand: 'usuario_id',
        sort: '-created',
        limit: 1000,
      })

      const grouped = chartResult.reduce((acc: any, curr: any) => {
        const uName =
          curr.expand?.usuario_id?.name || curr.expand?.usuario_id?.email || curr.usuario_id
        acc[uName] = (acc[uName] || 0) + 1
        return acc
      }, {})

      const cData = Object.keys(grouped)
        .map((k) => ({ name: k, actions: grouped[k] }))
        .sort((a, b) => b.actions - a.actions)
      setChartData(cData)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as auditorias.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, userId, actionType, tableName, searchTerm, dateFrom, dateTo])

  useRealtime('auditoria_movimentacoes', () => {
    loadData()
  })

  if (user?.nivel_acesso !== 1) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <ShieldCheck className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Esta área é restrita a administradores do sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Monitoramento e rastreabilidade de ações no ERP
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-t-4 border-t-slate-800 shadow-md">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-500" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Usuário</label>
                  <Select
                    value={userId}
                    onValueChange={(v) => {
                      setUserId(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos os usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Tipo de Ação</label>
                  <Select
                    value={actionType}
                    onValueChange={(v) => {
                      setActionType(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="Criação">Criação</SelectItem>
                      <SelectItem value="Edição">Edição</SelectItem>
                      <SelectItem value="Exclusão">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Tabela Afetada</label>
                  <Select
                    value={tableName}
                    onValueChange={(v) => {
                      setTableName(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas as tabelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as tabelas</SelectItem>
                      {systemTables.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
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
                    className="h-9 text-sm"
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
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Buscar por ID de registro..."
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
                    setUserId('all')
                    setActionType('all')
                    setTableName('all')
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
                    <TableHead className="font-semibold text-slate-700">Tabela</TableHead>
                    <TableHead className="font-semibold text-slate-700">ID Registro</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">
                      Detalhes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando registros...
                      </TableCell>
                    </TableRow>
                  ) : data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum registro de auditoria encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-mono text-xs whitespace-nowrap text-slate-500">
                          {format(parseISO(log.created), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-medium text-sm text-slate-900">
                          {log.expand?.usuario_id?.name ||
                            log.expand?.usuario_id?.email ||
                            'Sistema'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                              log.tipo_acao === 'Criação'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : log.tipo_acao === 'Edição'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {log.tipo_acao}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {log.tabela_afetada}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {log.registro_id}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-slate-50 p-0 border-slate-200">
                              <DialogHeader className="p-6 pb-4 bg-white border-b">
                                <DialogTitle className="text-xl flex items-center gap-2 text-slate-900">
                                  <ShieldCheck className="w-6 h-6 text-blue-600" /> Comparação de
                                  Modificação
                                </DialogTitle>
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                                  <div>
                                    <strong className="text-slate-900">Ação:</strong>{' '}
                                    {log.tipo_acao}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">Tabela:</strong>{' '}
                                    <span className="font-mono bg-slate-100 px-1 rounded">
                                      {log.tabela_afetada}
                                    </span>
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">Registro:</strong>{' '}
                                    <span className="font-mono bg-slate-100 px-1 rounded">
                                      {log.registro_id}
                                    </span>
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">Usuário:</strong>{' '}
                                    {log.expand?.usuario_id?.name ||
                                      log.expand?.usuario_id?.email ||
                                      'Sistema'}
                                  </div>
                                </div>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                                {log.tipo_acao === 'Criação' ? (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-3 text-emerald-800 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{' '}
                                      Dados Criados
                                    </h4>
                                    <JsonDisplay dataStr={log.dados_novos} />
                                  </div>
                                ) : log.tipo_acao === 'Exclusão' ? (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-3 text-rose-800 flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>{' '}
                                      Dados Excluídos
                                    </h4>
                                    <JsonDisplay dataStr={log.dados_anteriores} />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-sm mb-3 text-rose-800 flex items-center gap-2 border-b border-rose-200 pb-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>{' '}
                                        Dados Anteriores
                                      </h4>
                                      <JsonDisplay dataStr={log.dados_anteriores} />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center gap-2 border-b border-blue-200 pb-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>{' '}
                                        Dados Novos
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
              <p className="text-sm text-slate-500 font-medium">
                Página <span className="text-slate-900 font-semibold">{page}</span> de{' '}
                <span className="text-slate-900 font-semibold">{Math.max(1, data.totalPages)}</span>
                <span className="mx-2 text-slate-300">|</span>
                Total de {data.totalItems} registros
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages || loading}
                  className="shadow-sm"
                >
                  Próxima <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md border-t-4 border-t-[#1e3a8a]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Activity className="w-5 h-5 text-[#1e3a8a]" />
                Atividade por Usuário
              </CardTitle>
              <CardDescription>Volume de ações (últimos 1000 registros)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                  Sem dados para exibir.
                </div>
              ) : (
                <div className="h-[300px] w-full mt-4">
                  <ChartContainer
                    config={{ actions: { label: 'Ações' } }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickFormatter={(value) => value.split(' ')[0]}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="actions"
                          fill="#1e3a8a"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md bg-slate-900 text-white border-0">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> Integridade de Dados
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Todos os registros de auditoria são imutáveis e armazenados com segurança pela
                infraestrutura do sistema. Nenhuma modificação pode ser feita nos logs gerados,
                garantindo total conformidade e rastreabilidade para a Gestão Pecuária 360º.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
