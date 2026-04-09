import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  createVenda,
  getParceirosClientes,
  getEventos,
  getAnimaisDisponiveis,
} from '@/services/vendas'

export default function VendaForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])

  const [formData, setFormData] = useState({
    cliente_id: '',
    evento_id: '',
    data_venda: new Date().toISOString().split('T')[0],
    tipo_gado: 'Comercial',
    forma_pagamento: 'AVista',
    status_venda: 'Pendente',
    numero_parcelas: 1,
  })

  const [items, setItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({
    animal_id: '',
    valor_unitario: '',
    desconto_aplicado: '0',
  })

  useEffect(() => {
    Promise.all([getParceirosClientes(), getEventos(), getAnimaisDisponiveis()]).then(
      ([c, e, a]) => {
        setClientes(c)
        setEventos(e)
        setAnimais(a)
      },
    )
  }, [])

  const handleAddItem = () => {
    if (!newItem.animal_id || !newItem.valor_unitario) {
      toast({ title: 'Preencha o animal e o valor unitário', variant: 'destructive' })
      return
    }
    const animal = animais.find((a) => a.id === newItem.animal_id)
    if (items.some((i) => i.animal_id === newItem.animal_id)) {
      toast({ title: 'Este animal já foi adicionado', variant: 'destructive' })
      return
    }
    setItems([...items, { ...newItem, animal }])
    setNewItem({ animal_id: '', valor_unitario: '', desconto_aplicado: '0' })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um animal à venda', variant: 'destructive' })
      return
    }
    if (!formData.cliente_id) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const dataToSave = { ...formData, data_venda: new Date(formData.data_venda).toISOString() }
      if (!dataToSave.evento_id || dataToSave.evento_id === 'none') delete dataToSave.evento_id

      await createVenda(dataToSave, items)
      toast({ title: 'Venda registrada com sucesso!' })
      navigate('/vendas/geral')
    } catch (err) {
      toast({ title: 'Erro ao salvar venda', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce(
    (acc, item) => acc + (Number(item.valor_unitario) - Number(item.desconto_aplicado)),
    0,
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nova Venda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parceiro/cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evento (Opcional)</Label>
              <Select
                value={formData.evento_id}
                onValueChange={(v) => setFormData({ ...formData, evento_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Venda direta (Nenhum evento)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Venda direta (Nenhum evento)</SelectItem>
                  {eventos.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_evento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da Venda *</Label>
              <Input
                type="date"
                value={formData.data_venda}
                onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gado *</Label>
              <Select
                value={formData.tipo_gado}
                onValueChange={(v) => setFormData({ ...formData, tipo_gado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="PO">Puro de Origem (PO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(v) => {
                  setFormData({
                    ...formData,
                    forma_pagamento: v,
                    numero_parcelas: v === 'AVista' ? 1 : Math.max(2, formData.numero_parcelas),
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVista">À Vista</SelectItem>
                  <SelectItem value="Parcelado">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.forma_pagamento === 'Parcelado' && (
              <div className="space-y-2">
                <Label>Número de Parcelas *</Label>
                <Input
                  type="number"
                  min="2"
                  max="48"
                  value={formData.numero_parcelas}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_parcelas: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status da Venda *</Label>
              <Select
                value={formData.status_venda}
                onValueChange={(v) => setFormData({ ...formData, status_venda: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Animais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="space-y-2 md:col-span-5">
                <Label>Animal</Label>
                <Select
                  value={newItem.animal_id}
                  onValueChange={(v) => setNewItem({ ...newItem, animal_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Busque um animal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {animais.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.id_manejo_brinco} - {a.categoria} ({a.peso_atual_kg || 0} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>Valor Unitário (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.valor_unitario}
                  onChange={(e) => setNewItem({ ...newItem, valor_unitario: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.desconto_aplicado}
                  onChange={(e) => setNewItem({ ...newItem, desconto_aplicado: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-slate-800 hover:bg-slate-900"
                >
                  <Plus className="w-4 h-4 mr-2" /> Incluir
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Brinco / Identificação</th>
                      <th className="p-3 text-left">Categoria</th>
                      <th className="p-3 text-right">Valor Base</th>
                      <th className="p-3 text-right">Desconto</th>
                      <th className="p-3 text-right">Valor Final</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, idx) => {
                      const base = Number(item.valor_unitario)
                      const desc = Number(item.desconto_aplicado) || 0
                      const final = base - desc
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-medium">{item.animal.id_manejo_brinco}</td>
                          <td className="p-3">{item.animal.categoria}</td>
                          <td className="p-3 text-right text-gray-500">R$ {base.toFixed(2)}</td>
                          <td className="p-3 text-right text-red-500">
                            {desc > 0 ? `- R$ ${desc.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-medium">R$ {final.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-emerald-50 font-bold border-t">
                    <tr>
                      <td colSpan={4} className="p-4 text-right">
                        Total da Venda:
                      </td>
                      <td className="p-4 text-right text-emerald-700 text-base">
                        R$ {total.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/vendas/geral')}
            className="w-32"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 px-8"
          >
            {loading ? 'Salvando...' : 'Finalizar Venda'}
          </Button>
        </div>
      </form>
    </div>
  )
}
