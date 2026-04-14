import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, Users, Activity } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function TabVendas() {
  const [boletos, setBoletos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])

  const loadData = async () => {
    try {
      const bol = await pb
        .collection('boletos')
        .getFullList({ expand: 'venda_id,venda_id.cliente_id' })
      setBoletos(bol)
      const cli = await pb
        .collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro = 'Cliente' || tipo_cliente != ''" })
      setClientes(cli)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('boletos', loadData)

  const analytics = useMemo(() => {
    const today = new Date()
    let overdueCount = 0
    let overdueValue = 0
    let dueSoonCount = 0

    const debtorMap: Record<string, { name: string; debt: number }> = {}

    boletos.forEach((b) => {
      const isPending = b.status_boleto !== 'Pago' && b.status_boleto !== 'Cancelado'
      if (!isPending) return

      const vDate = new Date(b.data_vencimento)
      const diffTime = vDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        overdueCount++
        overdueValue += b.valor_boleto || 0
      } else if (diffDays <= 3) {
        dueSoonCount++
      }

      const clientName = b.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'Desconhecido'
      if (!debtorMap[clientName]) debtorMap[clientName] = { name: clientName, debt: 0 }
      debtorMap[clientName].debt += b.valor_boleto || 0
    })

    const topDebtors = Object.values(debtorMap)
      .filter((d) => d.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5)

    return { overdueCount, overdueValue, dueSoonCount, topDebtors }
  }, [boletos])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Boletos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.overdueCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              R$ {analytics.overdueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-yellow-500" /> Vencem em 3 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.dueSoonCount}</div>
            <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Users className="w-4 h-4 mr-2 text-emerald-500" /> Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{clientes.length}</div>
            <p className="text-xs text-gray-500 mt-1">Ativos na base</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-500" /> Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Vendas sem cobrança</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Maiores Devedores (Risco)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topDebtors.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b border-gray-100 pb-2"
                >
                  <span className="font-medium text-gray-700">{d.name}</span>
                  <span className="text-red-600 font-bold">
                    R$ {d.debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {analytics.topDebtors.length === 0 && (
                <p className="text-gray-500">Nenhum devedor encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
