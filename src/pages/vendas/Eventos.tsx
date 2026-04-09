import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEventosVenda, createEventoVenda } from '@/services/eventos_venda'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Eye, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function EventosVenda() {
  const { user } = useAuth()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 2

  const [eventos, setEventos] = useState<any[]>([])
  const [form, setForm] = useState({
    nome_evento: '',
    tipo_evento: '',
    data_evento: '',
    local: '',
    responsavel_evento: '',
    status: 'Planejado',
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const res = await getEventosVenda()
      setEventos(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('eventos_venda', () => {
    loadData()
  })

  const handleCreate = async () => {
    if (!form.nome_evento || !form.tipo_evento || !form.data_evento) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    try {
      await createEventoVenda({
        ...form,
        data_evento: new Date(form.data_evento).toISOString(),
        custo_total_evento: 0,
        receita_total_evento: 0,
      })
      toast({ title: 'Sucesso', description: 'Evento criado.' })
      setForm({
        nome_evento: '',
        tipo_evento: '',
        data_evento: '',
        local: '',
        responsavel_evento: '',
        status: 'Planejado',
      })
    } catch (e: any) {
      toast({ title: 'Erro ao criar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Eventos de Venda</h1>
      </div>

      {canEdit && (
        <Card className="mb-8 border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-emerald-900">Novo Evento</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nome do Evento *"
              value={form.nome_evento}
              onChange={(e) => setForm({ ...form, nome_evento: e.target.value })}
              className="border-gray-300"
            />
            <Select
              value={form.tipo_evento}
              onValueChange={(v) => setForm({ ...form, tipo_evento: v })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Tipo *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leilão">Leilão</SelectItem>
                <SelectItem value="Feira">Feira</SelectItem>
                <SelectItem value="Venda_Fazenda">Venda na Fazenda</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={form.data_evento}
              onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
              className="border-gray-300"
            />
            <Input
              placeholder="Local"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
              className="border-gray-300"
            />
            <Input
              placeholder="Responsável"
              value={form.responsavel_evento}
              onChange={(e) => setForm({ ...form, responsavel_evento: e.target.value })}
              className="border-gray-300"
            />
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planejado">Planejado</SelectItem>
                <SelectItem value="Em_Andamento">Em Andamento</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-3 flex justify-end">
              <Button
                onClick={handleCreate}
                className="bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Cadastrar Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 font-semibold text-black">Nome</th>
              <th className="p-3 font-semibold text-black">Tipo</th>
              <th className="p-3 font-semibold text-black">Data</th>
              <th className="p-3 font-semibold text-black">Status</th>
              <th className="p-3 font-semibold text-black text-right">Custo Total</th>
              <th className="p-3 font-semibold text-black text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-black">{ev.nome_evento}</td>
                <td className="p-3 text-black">{ev.tipo_evento?.replace('_', ' ')}</td>
                <td className="p-3 text-black">{format(new Date(ev.data_evento), 'dd/MM/yyyy')}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-200 text-black rounded text-xs">
                    {ev.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 text-right font-medium text-black">
                  R$ {ev.custo_total_evento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-center">
                  <Link to={`/vendas/eventos/${ev.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-black hover:bg-emerald-50 hover:text-emerald-900"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Detalhes
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {eventos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Nenhum evento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
