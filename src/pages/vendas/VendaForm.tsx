import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Plus, Trash2, ArrowLeft, Save, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  createVenda,
  updateVenda,
  getVendaCompleta,
  getParceirosClientes,
  getEventos,
  getAnimaisParaVenda,
} from '@/services/vendas'

export default function VendaForm() {
  const { id } = useParams()
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
    centro_custo: 'CC02-Comercial TIP',
  })

  const [items, setItems] = useState<any[]>([])
  const [parcelas, setParcelas] = useState<any[]>([])
  const [newItem, setNewItem] = useState({
    animal_id: '',
    valor_unitario: '',
    desconto_aplicado: '0',
  })

  useEffect(() => {
    Promise.all([getParceirosClientes(), getEventos(), getAnimaisParaVenda(id)]).then(
      ([c, e, a]) => {
        setClientes(c)
        setEventos(e)
        setAnimais(a)
      },
    )

    if (id) {
      getVendaCompleta(id).then(({ venda, itens, parcelas: parcelasBD }) => {
        setFormData({
          cliente_id: venda.cliente_id,
          evento_id: venda.evento_id || 'none',
          data_venda: venda.data_venda.split('T')[0],
          tipo_gado: venda.tipo_gado,
          forma_pagamento: venda.forma_pagamento,
          status_venda: venda.status_venda,
          numero_parcelas: venda.numero_parcelas || 1,
          centro_custo: 'CC02-Comercial TIP',
        })
        setItems(
          itens.map((i) => ({
            ...i,
            animal: i.expand?.animal_id,
          })),
        )
        setParcelas(
          parcelasBD.map((p) => ({
            numero: p.numero_parcela,
            valor: p.valor_parcela,
            data_vencimento: p.data_vencimento.split('T')[0],
            status_parcela: p.status_parcela,
          })),
        )
      })
    }
  }, [id])

  const total = items.reduce(
    (acc, item) => acc + (Number(item.valor_unitario) - Number(item.desconto_aplicado)),
    0,
  )

  const totalCost = items.reduce(
    (acc, item) => acc + (item.animal?.custo_variavel_acumulado || 0),
    0,
  )

  const profitMargin = total - totalCost
  const profitMarginPercent = total > 0 ? (profitMargin / total) * 100 : 0

  useEffect(() => {
    if (formData.forma_pagamento === 'Parcelado' && items.length > 0 && !id) {
      const newParcelas = []
      const val = total / formData.numero_parcelas
      for (let i = 1; i <= formData.numero_parcelas; i++) {
        const d = new Date()
        d.setDate(d.getDate() + 30 * i)
        newParcelas.push({
          numero: i,
          valor: val.toFixed(2),
          data_vencimento: d.toISOString().split('T')[0],
        })
      }
      setParcelas(newParcelas)
    } else if (formData.forma_pagamento === 'AVista') {
      setParcelas([])
    }
  }, [formData.numero_parcelas, total, formData.forma_pagamento, items.length, id])

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

  const handleParcelaChange = (index: number, field: string, value: string) => {
    const updated = [...parcelas]
    updated[index][field] = value
    setParcelas(updated)
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

    if (formData.forma_pagamento === 'Parcelado') {
      const sumParcelas = parcelas.reduce((acc, p) => acc + Number(p.valor), 0)
      if (Math.abs(sumParcelas - total) > 0.1) {
        toast({
          title: 'A soma das parcelas deve ser igual ao total da venda',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const dataToSave = { ...formData, data_venda: new Date(formData.data_venda).toISOString() }
      if (!dataToSave.evento_id || dataToSave.evento_id === 'none')
        delete (dataToSave as any).evento_id
      delete (dataToSave as any).centro_custo

      if (id) {
        await updateVenda(id, dataToSave, items, parcelas)
        toast({ title: 'Venda atualizada com sucesso!' })
      } else {
        await createVenda(dataToSave, items, parcelas)
        toast({ title: 'Venda registrada com sucesso!' })
      }
      navigate('/vendas/geral')
    } catch (err) {
      toast({ title: 'Erro ao salvar venda', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#094016' }}>
          {id ? 'Editar Venda' : 'Nova Venda'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <CardTitle style={{ color: '#094016' }}>Dados da Venda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.nome_razao_social}</span>
                        <span className="text-xs text-gray-500">
                          {c.numero_documento || c.email}
                        </span>
                      </div>
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
              <Label>Centro de Custo</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(v) => setFormData({ ...formData, centro_custo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC01-Nelore PO">CC01-Nelore PO</SelectItem>
                  <SelectItem value="CC02-Comercial TIP">CC02-Comercial TIP</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Evento (Opcional)</Label>
              <Select
                value={formData.evento_id}
                onValueChange={(v) => setFormData({ ...formData, evento_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Venda direta" />
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

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <CardTitle style={{ color: '#094016' }}>Animais e Rentabilidade</CardTitle>
            <CardDescription>
              Adicione os animais para calcular o custo total e a margem de lucro da venda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                  placeholder="0.00"
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
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full text-white"
                  style={{ backgroundColor: '#094016' }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Incluir
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Animal</th>
                      <th className="p-3 text-right">Custo Acumulado</th>
                      <th className="p-3 text-right">Valor Venda</th>
                      <th className="p-3 text-right">Desconto</th>
                      <th className="p-3 text-right">Valor Final</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const base = Number(item.valor_unitario)
                      const desc = Number(item.desconto_aplicado) || 0
                      const final = base - desc
                      const cost = item.animal?.custo_variavel_acumulado || 0
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-medium">{item.animal?.id_manejo_brinco}</td>
                          <td className="p-3 text-right text-orange-600">R$ {cost.toFixed(2)}</td>
                          <td className="p-3 text-right text-gray-600">R$ {base.toFixed(2)}</td>
                          <td className="p-3 text-right text-red-500">
                            {desc > 0 ? `- R$ ${desc.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-medium" style={{ color: '#094016' }}>
                            R$ {final.toFixed(2)}
                          </td>
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
                  <tfoot className="bg-emerald-50 border-t border-emerald-100">
                    <tr>
                      <td colSpan={2} className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">Custo Total (Animais)</span>
                          <span className="text-lg font-bold text-orange-700">
                            R$ {totalCost.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td colSpan={2} className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">Margem (Lucro Bruto)</span>
                          <span
                            className={`text-lg font-bold ${profitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                          >
                            R$ {profitMargin.toFixed(2)} ({profitMarginPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td colSpan={2} className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-600">Valor Total da Venda</span>
                          <span className="text-xl font-bold" style={{ color: '#094016' }}>
                            R$ {total.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <CardTitle style={{ color: '#094016' }}>Condições de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      forma_pagamento: v,
                      numero_parcelas: v === 'AVista' ? 1 : Math.max(2, formData.numero_parcelas),
                    })
                  }
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
            </div>

            {formData.forma_pagamento === 'Parcelado' && parcelas.length > 0 && (
              <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-600" /> Cronograma de Parcelas
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {parcelas.map((p, i) => (
                    <div
                      key={i}
                      className="flex gap-4 items-center bg-white p-3 border rounded shadow-sm"
                    >
                      <div className="w-16 text-center text-sm font-bold text-gray-500 bg-gray-100 py-1 rounded">
                        #{p.numero}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1 block">Vencimento</Label>
                        <Input
                          type="date"
                          value={p.data_vencimento}
                          onChange={(e) =>
                            handleParcelaChange(i, 'data_vencimento', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1 block">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={p.valor}
                          onChange={(e) => handleParcelaChange(i, 'valor', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-32 border-gray-300"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="text-white px-8 shadow-md"
            style={{ backgroundColor: '#094016' }}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Venda'}
          </Button>
        </div>
      </form>
    </div>
  )
}
