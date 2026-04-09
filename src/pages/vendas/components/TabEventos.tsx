import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEventosG, deleteEventoG } from '@/services/vendas_gestao'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ModalNovoEvento } from './ModalNovoEvento'
import { useToast } from '@/hooks/use-toast'

export default function TabEventos() {
  const [eventos, setEventos] = useState<any[]>([])
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [openModal, setOpenModal] = useState(false)
  const { toast } = useToast()

  const load = async () => getEventosG().then(setEventos).catch(console.error)
  useEffect(() => {
    load()
  }, [])
  useRealtime('eventos_venda', load)

  const filtrados = eventos.filter((e) => filtroTipo === 'Todos' || e.tipo_evento === filtroTipo)
  const custoTot = filtrados.reduce((acc, e) => acc + (e.custo_total_evento || 0), 0)
  const recTot = filtrados.reduce((acc, e) => acc + (e.receita_total_evento || 0), 0)

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir evento? Todas as informações ligadas podem ser perdidas.')) return
    try {
      await deleteEventoG(id)
      toast({ title: 'Evento excluído com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Custo Total (Filtrado)</p>
            <p className="text-2xl font-bold text-red-600">R$ {custoTot.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Receita Total (Filtrado)</p>
            <p className="text-2xl font-bold text-emerald-600">
              R$ {recTot.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <div className="flex flex-col justify-center space-y-2">
          <Button
            onClick={() => setOpenModal(true)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white w-full h-12 shadow-sm"
          >
            <Plus className="mr-2 h-5 w-5" /> Novo Evento
          </Button>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="border-gray-300 h-10 bg-white">
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Tipos</SelectItem>
              <SelectItem value="Leilão">Leilão</SelectItem>
              <SelectItem value="Feira">Feira</SelectItem>
              <SelectItem value="Venda_Fazenda">Venda na Fazenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-md overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200 text-black">
            <tr>
              <th className="p-3 font-semibold">Nome</th>
              <th className="p-3 font-semibold">Tipo</th>
              <th className="p-3 font-semibold">Data</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Custo / Receita</th>
              <th className="p-3 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((ev) => (
              <tr key={ev.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-black">{ev.nome_evento}</td>
                <td className="p-3 text-gray-600">{ev.tipo_evento?.replace('_', ' ')}</td>
                <td className="p-3 text-gray-600">
                  {format(new Date(ev.data_evento), 'dd/MM/yyyy')}
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-200 text-black text-xs rounded-full">
                    {ev.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="text-red-600 text-xs font-medium mb-1">
                    C: R$ {ev.custo_total_evento || 0}
                  </div>
                  <div className="text-emerald-600 text-xs font-medium">
                    R: R$ {ev.receita_total_evento || 0}
                  </div>
                </td>
                <td className="p-3 text-center space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/vendas/eventos/${ev.id}`}>
                      <Eye className="h-4 w-4 text-emerald-800" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ModalNovoEvento open={openModal} onOpenChange={setOpenModal} onSuccess={load} />
    </div>
  )
}
