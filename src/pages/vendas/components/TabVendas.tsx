import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertCircle, Clock, CalendarDays } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function TabVendas() {
  const [data, setData] = useState({
    recebido: 0,
    aReceber: 0,
    vencido: 0,
    proximos7Dias: 0,
  })

  const loadDashboard = async () => {
    try {
      const res = await pb.send('/backend/v1/obter_dashboard_financeiro_vendas', { method: 'GET' })
      setData(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useRealtime('parcelas_venda', loadDashboard)
  useRealtime('vendas', loadDashboard)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Financeiro</h2>
        <p className="text-sm text-gray-500">Visão avançada dos recebíveis de vendas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-emerald-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Recebido</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {formatCurrency(data.recebido)}
            </div>
            <p className="text-xs text-emerald-600 mt-1">Total já pago</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">A Receber</CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(data.aReceber)}</div>
            <p className="text-xs text-blue-600 mt-1">Saldo futuro pendente</p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Vencido</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(data.vencido)}</div>
            <p className="text-xs text-red-600 mt-1">Parcelas em atraso</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Vencendo em 7 dias</CardTitle>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {formatCurrency(data.proximos7Dias)}
            </div>
            <p className="text-xs text-amber-600 mt-1">Vencimentos na próxima semana</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
