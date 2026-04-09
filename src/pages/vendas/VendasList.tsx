import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getVendas, deleteVenda, updateVendaStatus } from '@/services/vendas'
import { format } from 'date-fns'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function VendasList() {
  const [vendas, setVendas] = useState<any[]>([])
  const { toast } = useToast()

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
    if (!confirm('Deseja excluir esta venda? Todas as informações atreladas serão removidas.'))
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vendas de Animais</h1>
          <p className="text-gray-500 mt-1">Gerencie as transações de venda do rebanho</p>
        </div>
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
          <Link to="/vendas/nova">
            <Plus className="w-4 h-4 mr-2" /> Nova Venda
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Tipo Gado</th>
                  <th className="p-4 font-medium text-center">Qtd Animais</th>
                  <th className="p-4 font-medium">Valor Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">{format(new Date(venda.data_venda), 'dd/MM/yyyy')}</td>
                    <td className="p-4">
                      {venda.expand?.cliente_id?.nome_razao_social || 'Cliente não encontrado'}
                    </td>
                    <td className="p-4">{venda.tipo_gado}</td>
                    <td className="p-4 text-center">{venda.quantidade_animais}</td>
                    <td className="p-4 font-medium text-emerald-700">
                      R${' '}
                      {venda.valor_total_venda.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4">
                      <Select
                        defaultValue={venda.status_venda}
                        onValueChange={(val) => handleStatusChange(venda.id, val)}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Confirmada">Confirmada</SelectItem>
                          <SelectItem value="Entregue">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(venda.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {vendas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Nenhuma venda registrada no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
