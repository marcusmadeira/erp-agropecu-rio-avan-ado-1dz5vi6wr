import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getVendasExpanded, deletarVenda, cancelarVenda } from '@/services/vendas_gestao'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Ban, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ModalNovaVenda } from './ModalNovaVenda'

export default function TabVendas() {
  const [vendas, setVendas] = useState<any[]>([])
  const [openModal, setOpenModal] = useState(false)
  const { toast } = useToast()

  const load = async () => getVendasExpanded().then(setVendas).catch(console.error)
  useEffect(() => {
    load()
  }, [])
  useRealtime('vendas', load)

  const handleCancel = async (id: string) => {
    if (
      !confirm(
        'Deseja realmente cancelar esta venda? (Os animais não voltarão ao status disponível automaticamente nesta versão)',
      )
    )
      return
    try {
      await cancelarVenda(id)
      toast({ title: 'Venda cancelada' })
    } catch (e) {
      toast({ title: 'Erro ao cancelar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Registrar Nova Venda
        </Button>
      </div>
      <div className="border border-gray-200 rounded-md overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200 text-black">
            <tr>
              <th className="p-4 font-semibold">Data</th>
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold text-center">Animais</th>
              <th className="p-4 font-semibold">Valor Total</th>
              <th className="p-4 font-semibold">Pagamento</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 text-black">{format(new Date(v.data_venda), 'dd/MM/yyyy')}</td>
                <td className="p-4 text-gray-700">
                  {v.expand?.cliente_id?.nome_razao_social || '-'}
                </td>
                <td className="p-4 text-center text-gray-700">{v.quantidade_animais}</td>
                <td className="p-4 font-medium text-emerald-700">
                  R$ {v.valor_total_venda?.toLocaleString('pt-BR')}
                </td>
                <td className="p-4 text-gray-600">
                  {v.forma_pagamento === 'AVista' ? 'À Vista' : 'Parcelado'}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${v.status_venda === 'Cancelada' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-black'}`}
                  >
                    {v.status_venda}
                  </span>
                </td>
                <td className="p-4 text-center space-x-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/vendas/geral/${v.id}`}>
                      <Eye className="h-4 w-4 text-emerald-800" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancel(v.id)}
                    title="Cancelar Venda"
                  >
                    <Ban className="h-4 w-4 text-orange-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (confirm('Deletar venda e todo histórico financeiro associado?')) {
                        await deletarVenda(v.id)
                        load()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {vendas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Nenhuma venda registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ModalNovaVenda open={openModal} onOpenChange={setOpenModal} onSuccess={load} />
    </div>
  )
}
