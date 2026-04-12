import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Edit, TrendingUp, DollarSign, Users, Activity, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getVendas, deleteVenda, updateVendaStatus } from '@/services/vendas'
import { format } from 'date-fns'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

export default function VendasList() {
  const [vendas, setVendas] = useState<any[]>([])
  const { toast } = useToast()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterType, setFilterType] = useState('Todos')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const loadData = async () => {
    try {
      const data = await getVendas()
      setVendas(data)
    } catch (err) {
      toast({ title: 'Erro ao carregar vendas', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('vendas', loadData)

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Deseja excluir esta venda? Todas as informações atreladas (incluindo parcelas) serão removidas.',
      )
    )
      return
    try {
      await deleteVenda(id)
      toast({ title: 'Venda excluída com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateVendaStatus(id, status)
      toast({ title: 'Status atualizado com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const filteredVendas = useMemo(() => {
    return vendas.filter((v) => {
      const matchSearch =
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.expand?.cliente_id?.nome_razao_social || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const matchStatus = filterStatus === 'Todos' || v.status_venda === filterStatus
      const matchType = filterType === 'Todos' || v.tipo_gado === filterType
      const matchStart = !dateStart || new Date(v.data_venda) >= new Date(dateStart)
      const matchEnd = !dateEnd || new Date(v.data_venda) <= new Date(dateEnd)
      return matchSearch && matchStatus && matchType && matchStart && matchEnd
    })
  }, [vendas, searchTerm, filterStatus, filterType, dateStart, dateEnd])

  const analytics = useMemo(() => {
    let totalRevenue = 0
    let totalVolume = 0
    const monthlyMap: Record<string, { month: string; revenue: number; quantity: number }> = {}
    const clientMap: Record<string, { name: string; total: number }> = {}

    filteredVendas.forEach((v) => {
      totalRevenue += v.valor_total_venda || 0
      totalVolume += v.quantidade_animais || 0

      const d = new Date(v.data_venda)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, quantity: 0 }
      monthlyMap[monthStr].revenue += v.valor_total_venda || 0
      monthlyMap[monthStr].quantity += v.quantidade_animais || 0

      const cName = v.expand?.cliente_id?.nome_razao_social || 'Desconhecido'
      if (!clientMap[cName]) clientMap[cName] = { name: cName, total: 0 }
      clientMap[cName].total += v.valor_total_venda || 0
    })

    const chartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
    const topClients = Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    const ticketMedio = filteredVendas.length ? totalRevenue / filteredVendas.length : 0

    return { totalRevenue, totalVolume, ticketMedio, chartData, topClients }
  }, [filteredVendas])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {status}
          </Badge>
        )
      case 'Confirmada':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {status}
          </Badge>
        )
      case 'Entregue':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#094016' }}>
            Vendas de Animais
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie, analise e registre as transações de venda do rebanho
          </p>
        </div>
        <Button
          asChild
          className="text-white shadow-md hover:bg-[#073010]"
          style={{ backgroundColor: '#094016' }}
        >
          <Link to="/vendas/nova">
            <Plus className="w-4 h-4 mr-2" /> Nova Venda
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="bg-gray-100 p-1 mb-4 inline-flex">
          <TabsTrigger
            value="lista"
            className="data-[state=active]:bg-white data-[state=active]:text-[#094016]"
          >
            <FileText className="w-4 h-4 mr-2" /> Lista de Vendas
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-white data-[state=active]:text-[#094016]"
          >
            <Activity className="w-4 h-4 mr-2" /> Dashboard Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4 mt-0">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Buscar</label>
                <Input
                  placeholder="Cliente ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="PO">PO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Data Inicial</label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Data Final</label>
                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold">ID</th>
                      <th className="p-4 font-semibold">Data</th>
                      <th className="p-4 font-semibold">Cliente</th>
                      <th className="p-4 font-semibold">Tipo</th>
                      <th className="p-4 font-semibold text-center">Animais</th>
                      <th className="p-4 font-semibold text-right">Valor Total</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                      <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVendas.map((venda) => (
                      <tr key={venda.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">
                          {venda.id.slice(0, 8)}
                        </td>
                        <td className="p-4 text-gray-700">
                          {format(new Date(venda.data_venda), 'dd/MM/yyyy')}
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                          {venda.expand?.cliente_id?.nome_razao_social || 'Desconhecido'}
                        </td>
                        <td className="p-4 text-gray-600">{venda.tipo_gado}</td>
                        <td className="p-4 text-center font-medium text-gray-700">
                          {venda.quantidade_animais}
                        </td>
                        <td className="p-4 font-bold text-right" style={{ color: '#094016' }}>
                          R${' '}
                          {venda.valor_total_venda.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <Select
                            defaultValue={venda.status_venda}
                            onValueChange={(val) => handleStatusChange(venda.id, val)}
                          >
                            <SelectTrigger className="h-8 w-32 mx-auto text-xs border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Confirmada">Confirmada</SelectItem>
                              <SelectItem value="Entregue">Entregue</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <Button variant="ghost" size="icon" asChild title="Ver Detalhes">
                            <Link to={`/vendas/geral/${venda.id}`}>
                              <FileText className="w-4 h-4 text-blue-600" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link to={`/vendas/editar/${venda.id}`}>
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(venda.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredVendas.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          Nenhuma venda encontrada com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 rounded-full" style={{ color: '#094016' }}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Receita Total</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    R${' '}
                    {analytics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Volume de Animais</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {analytics.totalVolume} cabeças
                  </h3>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="p-3 bg-orange-100 text-orange-800 rounded-full">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ticket Médio por Venda</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    R$ {analytics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Receita Mensal (R$)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ revenue: { label: 'Receita', color: '#094016' } }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(val) => `R$${val / 1000}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Animais Vendidos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ quantity: { label: 'Animais', color: '#2563eb' } }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="quantity"
                        stroke="var(--color-quantity)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2" style={{ color: '#094016' }} /> Top 10 Clientes
                (Volume Financeiro)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topClients.map((client, idx) => (
                  <div key={idx} className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-sm mr-4"
                      style={{ color: '#094016' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-800">{client.name}</span>
                        <span className="font-bold" style={{ color: '#094016' }}>
                          R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: '#094016',
                            width: `${(client.total / (analytics.topClients[0]?.total || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.topClients.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Sem dados para exibir.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
