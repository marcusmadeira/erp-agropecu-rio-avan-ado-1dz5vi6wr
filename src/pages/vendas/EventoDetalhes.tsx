import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getEventoVenda,
  getCustosEvento,
  createCustoEvento,
  deleteCustoEvento,
  updateEventoVenda,
} from '@/services/eventos_venda'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function EventoDetalhes() {
  const { id } = useParams()
  const { user } = useAuth()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 2

  const [evento, setEvento] = useState<any>(null)
  const [custos, setCustos] = useState<any[]>([])
  const [form, setForm] = useState({ descricao_custo: '', valor_custo: '', data_custo: '' })
  const { toast } = useToast()

  const loadData = async () => {
    if (!id) return
    try {
      const ev = await getEventoVenda(id)
      setEvento(ev)
      const cs = await getCustosEvento(id)
      setCustos(cs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('eventos_venda', (e) => {
    if (e.record.id === id) loadData()
  })

  useRealtime('custos_evento', () => {
    loadData()
  })

  const handleAddCusto = async () => {
    if (!form.descricao_custo || !form.valor_custo || !form.data_custo) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos de custo.',
        variant: 'destructive',
      })
      return
    }
    try {
      await createCustoEvento({
        evento_id: id,
        descricao_custo: form.descricao_custo,
        valor_custo: parseFloat(form.valor_custo),
        data_custo: new Date(form.data_custo).toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Custo adicionado.' })
      setForm({ descricao_custo: '', valor_custo: '', data_custo: '' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleDeleteCusto = async (custoId: string) => {
    if (!confirm('Deseja remover este custo?')) return
    try {
      await deleteCustoEvento(custoId)
      toast({ title: 'Removido', description: 'Custo removido com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleUpdateReceita = async (val: string) => {
    const num = parseFloat(val)
    if (isNaN(num) || !evento) return
    try {
      await updateEventoVenda(evento.id, { receita_total_evento: num })
      toast({ title: 'Sucesso', description: 'Receita atualizada.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  if (!evento) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <div className="flex items-center mb-6">
        <Link to="/vendas/eventos">
          <Button variant="ghost" className="mr-4 text-black hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Detalhes do Evento: {evento.nome_evento}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3">
            <CardTitle className="text-emerald-900 text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Tipo:</span> {evento.tipo_evento?.replace('_', ' ')}
            </p>
            <p>
              <span className="font-semibold">Data:</span>{' '}
              {format(new Date(evento.data_evento), 'dd/MM/yyyy')}
            </p>
            <p>
              <span className="font-semibold">Local:</span> {evento.local || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Responsável:</span>{' '}
              {evento.responsavel_evento || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {evento.status?.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 md:col-span-2">
          <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3">
            <CardTitle className="text-emerald-900 text-lg">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col md:flex-row gap-8">
            <div>
              <label className="text-xs font-semibold text-gray-500">Custo Total Registrado</label>
              <p className="text-3xl font-bold text-red-700">
                R${' '}
                {evento.custo_total_evento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Receita Total</label>
              {canEdit ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    defaultValue={evento.receita_total_evento}
                    onBlur={(e) => handleUpdateReceita(e.target.value)}
                    className="border-gray-300 w-40 text-lg font-bold text-emerald-700"
                  />
                </div>
              ) : (
                <p className="text-3xl font-bold text-emerald-700">
                  R${' '}
                  {evento.receita_total_evento?.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card className="border-gray-200 mb-8">
          <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3">
            <CardTitle className="text-emerald-900 text-lg">Adicionar Novo Custo</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold mb-1 block">Descrição do Custo *</label>
              <Input
                value={form.descricao_custo}
                onChange={(e) => setForm({ ...form, descricao_custo: e.target.value })}
                className="border-gray-300"
                placeholder="Ex: Frete, Divulgação..."
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-semibold mb-1 block">Valor (R$) *</label>
              <Input
                type="number"
                value={form.valor_custo}
                onChange={(e) => setForm({ ...form, valor_custo: e.target.value })}
                className="border-gray-300"
                placeholder="0.00"
              />
            </div>
            <div className="w-40">
              <label className="text-xs font-semibold mb-1 block">Data *</label>
              <Input
                type="date"
                value={form.data_custo}
                onChange={(e) => setForm({ ...form, data_custo: e.target.value })}
                className="border-gray-300"
              />
            </div>
            <Button
              onClick={handleAddCusto}
              className="bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Lançar Custo
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-bold mb-4">Histórico de Custos</h2>
      <div className="rounded-md border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 font-semibold text-black w-32">Data</th>
              <th className="p-3 font-semibold text-black">Descrição</th>
              <th className="p-3 font-semibold text-black text-right w-48">Valor (R$)</th>
              {canEdit && <th className="p-3 font-semibold text-black text-center w-24">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {custos.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-black">{format(new Date(c.data_custo), 'dd/MM/yyyy')}</td>
                <td className="p-3 text-black">{c.descricao_custo}</td>
                <td className="p-3 text-right font-medium text-red-700">
                  {c.valor_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                {canEdit && (
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCusto(c.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {custos.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="p-4 text-center text-gray-500">
                  Nenhum custo registrado para este evento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
