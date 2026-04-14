import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function TabOperacoes() {
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadVendas = async () => {
    try {
      setLoading(true)
      const records = await pb.collection('vendas').getFullList({
        sort: '-data_venda',
        expand: 'cliente_id,evento_id',
      })
      setVendas(records)
    } catch (error) {
      console.error('Error loading vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendas()
  }, [])

  useRealtime('vendas', () => {
    loadVendas()
  })

  const filteredVendas = vendas.filter((v) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const clienteNome = v.expand?.cliente_id?.nome_razao_social?.toLowerCase() || ''
    const status = v.status_venda?.toLowerCase() || ''
    return clienteNome.includes(term) || status.includes(term)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar vendas..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Link to="/vendas/nova">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo Gado</th>
                <th className="px-4 py-3">Qtd Animais</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Carregando operações de venda...
                  </td>
                </tr>
              ) : filteredVendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma operação de venda encontrada.
                  </td>
                </tr>
              ) : (
                filteredVendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(venda.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {venda.expand?.cliente_id?.nome_razao_social || 'Cliente não informado'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-normal text-gray-600">
                        {venda.tipo_gado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{venda.quantidade_animais}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(venda.valor_total_venda)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          venda.status_venda === 'Confirmada'
                            ? 'default'
                            : venda.status_venda === 'Pendente'
                              ? 'secondary'
                              : 'outline'
                        }
                        className={
                          venda.status_venda === 'Confirmada'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent'
                            : venda.status_venda === 'Pendente'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent'
                              : venda.status_venda === 'Entregue'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent'
                                : ''
                        }
                      >
                        {venda.status_venda}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/vendas/geral/${venda.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
