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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Info,
  Check,
  ChevronsUpDown,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
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
  const [openCliente, setOpenCliente] = useState(false)

  const [formData, setFormData] = useState({
    cliente_id: '',
    evento_id: '',
    data_venda: new Date().toISOString().split('T')[0],
    tipo_gado: 'Comercial',
    forma_pagamento: 'AVista',
    status_venda: 'Pendente',
    numero_parcelas: 1 as string | number,
    centro_custo: 'CC02',
    valor_entrada: '',
    data_vencimento_entrada: new Date().toISOString().split('T')[0],
  })

  const [intervaloParcelas, setIntervaloParcelas] = useState('30')

  const [items, setItems] = useState<any[]>([])
  const [parcelas, setParcelas] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [newItem, setNewItem] = useState({
    tipo_item: 'Animal',
    animal_id: '',
    lote_id: '',
    quantidade: '1',
    valor_unitario: '',
    desconto_aplicado: '0',
  })

  useEffect(() => {
    import('@/lib/pocketbase/client')
      .then((m) => m.default.collection('lotes').getFullList())
      .then(setLotes)
  }, [])

  useEffect(() => {
    Promise.all([getParceirosClientes(), getEventos(), getAnimaisParaVenda(id)]).then(
      ([c, e, a]) => {
        // Filter to show only customers
        setClientes(c.filter((cliente: any) => cliente.categoria_parceiro === 'Cliente'))
        setEventos(e)
        setAnimais(a)
      },
    )
  }, [id])

  useEffect(() => {
    if (id) {
      getVendaCompleta(id).then(({ venda, itens, parcelas: parcelasBD }) => {
        setFormData({
          cliente_id: venda.cliente_id,
          evento_id: venda.evento_id || 'none',
          data_venda: venda.data_venda.split('T')[0],
          tipo_gado: venda.tipo_gado,
          forma_pagamento: venda.forma_pagamento,
          status_venda: venda.status_venda,
          numero_parcelas: venda.numero_parcelas ?? (venda.forma_pagamento === 'AVista' ? 1 : ''),
          centro_custo: 'CC02',
          valor_entrada: venda.valor_entrada || '',
          data_vencimento_entrada: venda.data_vencimento_entrada
            ? venda.data_vencimento_entrada.split('T')[0]
            : venda.data_venda.split('T')[0],
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
    (acc, item) =>
      acc +
      (Number(item.valor_total || item.valor_unitario * (item.quantidade || 1)) -
        Number(item.desconto_aplicado)),
    0,
  )

  const totalCost = items.reduce(
    (acc, item) =>
      acc +
      (item.tipo_item === 'Lote'
        ? item.lote?.custo_acumulado_nutricao || 0
        : item.animal?.custo_variavel_acumulado || 0),
    0,
  )

  const profitMargin = total - totalCost
  const profitMarginPercent = total > 0 ? (profitMargin / total) * 100 : 0

  useEffect(() => {
    if (items.length > 0 && !id) {
      const newParcelas = []
      const valorEntradaNum = Number(formData.valor_entrada) || 0

      const todayStr = new Date().toISOString().split('T')[0]

      if (valorEntradaNum > 0) {
        const isPaga = formData.data_vencimento_entrada <= todayStr
        newParcelas.push({
          numero: 0,
          valor: valorEntradaNum.toFixed(2),
          data_vencimento: formData.data_vencimento_entrada,
          status_parcela: isPaga ? 'Paga' : 'Pendente',
        })
      }

      const saldoDevedor = Math.max(0, total - valorEntradaNum)

      if (formData.forma_pagamento === 'Parcelado') {
        if (saldoDevedor > 0) {
          const numParcelas = Number(formData.numero_parcelas)
          if (!isNaN(numParcelas) && numParcelas > 0 && Number.isInteger(numParcelas)) {
            const val = saldoDevedor / numParcelas
            const interval = parseInt(intervaloParcelas) || 30
            for (let i = 1; i <= numParcelas; i++) {
              const d = new Date(formData.data_venda)
              d.setDate(d.getDate() + interval * i)
              newParcelas.push({
                numero: i,
                valor: val.toFixed(2),
                data_vencimento: d.toISOString().split('T')[0],
                status_parcela: 'Pendente',
              })
            }
          }
        }
      } else if (formData.forma_pagamento === 'AVista') {
        if (saldoDevedor > 0) {
          const isPaga = formData.data_venda <= todayStr
          newParcelas.push({
            numero: 1,
            valor: saldoDevedor.toFixed(2),
            data_vencimento: formData.data_venda,
            status_parcela: isPaga ? 'Paga' : 'Pendente',
          })
        }
      }
      setParcelas(newParcelas)
    }
  }, [
    formData.numero_parcelas,
    total,
    formData.forma_pagamento,
    items.length,
    id,
    formData.valor_entrada,
    formData.data_venda,
    formData.data_vencimento_entrada,
    intervaloParcelas,
  ])

  const handleAddItem = () => {
    if (newItem.tipo_item === 'Animal') {
      if (!newItem.animal_id || !newItem.valor_unitario) {
        toast({ title: 'Preencha o animal e o valor unitário', variant: 'destructive' })
        return
      }
      const animal = animais.find((a) => a.id === newItem.animal_id)
      if (items.some((i) => i.tipo_item === 'Animal' && i.animal_id === newItem.animal_id)) {
        toast({ title: 'Este animal já foi adicionado', variant: 'destructive' })
        return
      }
      setItems([
        ...items,
        {
          ...newItem,
          animal,
          valor_total: Number(newItem.valor_unitario) * Number(newItem.quantidade),
        },
      ])
    } else {
      if (!newItem.lote_id || !newItem.valor_unitario) {
        toast({ title: 'Preencha o lote e o valor unitário', variant: 'destructive' })
        return
      }
      const lote = lotes.find((l) => l.id === newItem.lote_id)
      if (items.some((i) => i.tipo_item === 'Lote' && i.lote_id === newItem.lote_id)) {
        toast({ title: 'Este lote já foi adicionado', variant: 'destructive' })
        return
      }
      setItems([
        ...items,
        {
          ...newItem,
          lote,
          valor_total: Number(newItem.valor_unitario) * Number(newItem.quantidade),
        },
      ])
    }
    setNewItem({
      tipo_item: newItem.tipo_item,
      animal_id: '',
      lote_id: '',
      quantidade: '1',
      valor_unitario: '',
      desconto_aplicado: '0',
    })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleParcelaChange = (index: number, field: string, value: string) => {
    const updated = [...parcelas]
    updated[index][field] = value
    setParcelas(updated)
  }

  const handleCancelarVenda = async () => {
    if (
      confirm(
        'Tem certeza que deseja cancelar esta venda? As parcelas pendentes também serão canceladas.',
      )
    ) {
      setLoading(true)
      try {
        await pb.collection('vendas').update(id!, { status_venda: 'Cancelada' })
        const parcelasPendentes = await pb.collection('parcelas_venda').getFullList({
          filter: `venda_id = '${id}' && (status_parcela = 'Pendente' || status_parcela = 'Atrasada')`,
        })
        for (const p of parcelasPendentes) {
          await pb.collection('parcelas_venda').update(p.id, { status_parcela: 'Cancelada' })
        }

        await pb.collection('auditoria_movimentacoes').create({
          usuario_id: pb.authStore.record!.id,
          tipo_acao: 'Edição',
          tabela_afetada: 'vendas',
          registro_id: id!,
          description: 'Venda e parcelas pendentes canceladas manualmente.',
        })

        toast({ title: 'Venda cancelada com sucesso!' })
        navigate('/vendas/geral')
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
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

    const valorEntradaNum = Number(formData.valor_entrada) || 0
    if (valorEntradaNum > total) {
      toast({
        title: 'O valor de entrada não pode ser maior que o total da venda.',
        variant: 'destructive',
      })
      return
    }

    let finalNumeroParcelas = 1
    if (formData.forma_pagamento === 'Parcelado') {
      if (
        formData.numero_parcelas === '' ||
        formData.numero_parcelas === undefined ||
        formData.numero_parcelas === null ||
        Number(formData.numero_parcelas) === 0
      ) {
        toast({
          title: 'Erro de Validação',
          description: 'Preencha o número de parcelas (maior que zero).',
          variant: 'destructive',
        })
        return
      }

      const parcelasParsed = Number(formData.numero_parcelas)
      if (isNaN(parcelasParsed) || parcelasParsed <= 0 || !Number.isInteger(parcelasParsed)) {
        toast({
          title: 'Erro de Validação',
          description: 'O número de parcelas deve ser um número inteiro maior que zero.',
          variant: 'destructive',
        })
        return
      }

      finalNumeroParcelas = parcelasParsed

      const selectedClient = clientes.find((c) => c.id === formData.cliente_id)
      if (selectedClient && !selectedClient.numero_documento) {
        toast({
          title: 'Venda a prazo bloqueada: Cliente sem documento (CPF/CNPJ) cadastrado.',
          variant: 'destructive',
        })
        return
      }

      const sumParcelas = parcelas.reduce((acc, p) => acc + Number(p.valor), 0)
      if (Math.abs(sumParcelas - total) > 0.1) {
        toast({
          title: 'A soma das parcelas (incluindo entrada) deve ser igual ao total da venda',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        data_venda: new Date(formData.data_venda).toISOString(),
        data_vencimento_entrada: new Date(formData.data_vencimento_entrada).toISOString(),
        numero_parcelas: finalNumeroParcelas,
      }
      if (!dataToSave.evento_id || dataToSave.evento_id === 'none')
        delete (dataToSave as any).evento_id

      if (dataToSave.valor_entrada === '') {
        delete (dataToSave as any).valor_entrada
      } else {
        dataToSave.valor_entrada = Number(dataToSave.valor_entrada)
      }

      const parcelasToSave = parcelas.map((p) => ({
        ...p,
        numero: Number(p.numero),
        valor: Number(p.valor),
        numero_parcela: Number(p.numero),
        valor_parcela: Number(p.valor),
        data_vencimento: p.data_vencimento,
        status_parcela: p.status_parcela,
      }))

      const itemsToSave = items.map((i) => {
        const itemObj: any = {
          ...i,
          tipo_item: i.tipo_item,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario),
          desconto_aplicado: Number(i.desconto_aplicado),
        }
        if (i.tipo_item === 'Animal') {
          itemObj.animal_id = i.animal_id || i.animal?.id
          delete itemObj.lote_id
        } else {
          itemObj.lote_id = i.lote_id || i.lote?.id
          delete itemObj.animal_id
        }
        return itemObj
      })

      if (id) {
        delete (dataToSave as any).centro_custo
        await updateVenda(id, dataToSave, itemsToSave, parcelasToSave)
        toast({ title: 'Venda atualizada com sucesso!' })
      } else {
        await createVenda(dataToSave, itemsToSave, parcelasToSave)
        toast({ title: 'Venda registrada com sucesso!' })
      }
      navigate('/vendas/geral')
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        const errorMessages = Object.entries(errs)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n')
        toast({
          title: 'Erro de Validação',
          description: errorMessages,
          variant: 'destructive',
          duration: 5000,
        })
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" /> Erro
            </div>
          ),
          description: err.message || 'Erro ao salvar venda',
          className: 'bg-red-600 text-white border-red-700',
          duration: 3000,
        })
      }
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
            <div className="space-y-2 flex flex-col">
              <Label>Cliente *</Label>
              <Popover open={openCliente} onOpenChange={setOpenCliente}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCliente}
                    className="w-full justify-between font-normal"
                  >
                    {formData.cliente_id
                      ? clientes.find((c) => c.id === formData.cliente_id)?.nome_razao_social
                      : 'Selecione o cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.nome_razao_social} ${c.numero_documento || ''}`}
                            onSelect={() => {
                              setFormData({ ...formData, cliente_id: c.id })
                              setOpenCliente(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.cliente_id === c.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{c.nome_razao_social}</span>
                              <span className="text-xs text-gray-500">
                                {c.numero_documento || c.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Label>Valor de Entrada (Sinal)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.valor_entrada}
                onChange={(e) => setFormData({ ...formData, valor_entrada: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento da Entrada</Label>
              <Input
                type="date"
                value={formData.data_vencimento_entrada}
                onChange={(e) =>
                  setFormData({ ...formData, data_vencimento_entrada: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Centro de Custo *</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(v) => setFormData({ ...formData, centro_custo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC01">CC01 - Nelore PO</SelectItem>
                  <SelectItem value="CC02">CC02 - Comercial TIP</SelectItem>
                  <SelectItem value="CC03">CC03 - Estrutural/Rateio</SelectItem>
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
              <Label>Tipo de Venda *</Label>
              <Select
                value={formData.tipo_venda || 'Avulsa'}
                onValueChange={(v) => setFormData({ ...formData, tipo_venda: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avulsa">Avulsa</SelectItem>
                  <SelectItem value="Evento">Evento (Leilão/Feira)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_venda === 'Evento' && (
              <div className="space-y-2">
                <Label>Evento Vinculado</Label>
                <Select
                  value={formData.evento_id}
                  onValueChange={(v) => setFormData({ ...formData, evento_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum evento</SelectItem>
                    {eventos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome_evento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
            <CardTitle style={{ color: '#094016' }}>Animais e Rentabilidade</CardTitle>
            <CardDescription>
              Adicione os animais para calcular o custo total e a margem de lucro da venda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2 md:col-span-2">
                <Label>Tipo Item</Label>
                <Select
                  value={newItem.tipo_item}
                  onValueChange={(v) =>
                    setNewItem({ ...newItem, tipo_item: v, animal_id: '', lote_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Animal">Animal</SelectItem>
                    <SelectItem value="Lote">Lote Inteiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label>{newItem.tipo_item === 'Animal' ? 'Animal' : 'Lote'}</Label>
                {newItem.tipo_item === 'Animal' ? (
                  <Select
                    value={newItem.animal_id}
                    onValueChange={(v) => setNewItem({ ...newItem, animal_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Busque..." />
                    </SelectTrigger>
                    <SelectContent>
                      {animais.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.id_manejo_brinco} - {a.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={newItem.lote_id}
                    onValueChange={(v) => setNewItem({ ...newItem, lote_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Busque..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lotes.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nome_lote} ({l.quantidade_cabecas} cab)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantidade}
                  onChange={(e) => setNewItem({ ...newItem, quantidade: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.valor_unitario}
                  onChange={(e) => setNewItem({ ...newItem, valor_unitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>Desc.</Label>
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
                      <th className="p-3 text-left">Item (Animal/Lote)</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Custo</th>
                      <th className="p-3 text-right">Valor (Base)</th>
                      <th className="p-3 text-right">Desconto</th>
                      <th className="p-3 text-right">Final</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const base = Number(item.valor_total || item.valor_unitario * item.quantidade)
                      const desc = Number(item.desconto_aplicado) || 0
                      const final = base - desc
                      const cost =
                        item.tipo_item === 'Lote'
                          ? item.lote?.custo_acumulado_nutricao || 0
                          : item.animal?.custo_variavel_acumulado || 0
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-medium">
                            {item.tipo_item === 'Lote'
                              ? `Lote: ${item.lote?.nome_lote}`
                              : `Animal: ${item.animal?.id_manejo_brinco}`}
                          </td>
                          <td className="p-3 text-center">{item.quantidade || 1}</td>
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
                      numero_parcelas:
                        v === 'AVista'
                          ? 1
                          : formData.numero_parcelas === 1
                            ? ''
                            : formData.numero_parcelas,
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
                <>
                  <div className="space-y-2">
                    <Label>Número de Parcelas (Saldo) *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="40"
                      value={formData.numero_parcelas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numero_parcelas: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo entre Parcelas</Label>
                    <Select value={intervaloParcelas} onValueChange={setIntervaloParcelas}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Mensal (30 dias)</SelectItem>
                        <SelectItem value="15">Quinzenal (15 dias)</SelectItem>
                        <SelectItem value="10">Dez dias (10 dias)</SelectItem>
                        <SelectItem value="7">Semanal (7 dias)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {parcelas.length > 0 && (
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
                      <div
                        className={cn(
                          'w-16 text-center text-sm font-bold text-white py-1 rounded',
                          p.numero === 0 ? 'bg-emerald-600' : 'bg-gray-400',
                        )}
                      >
                        {p.numero === 0 ? 'Sinal' : `#${p.numero}`}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1 block">Vencimento</Label>
                        <Input
                          type="date"
                          value={p.data_vencimento}
                          onChange={(e) =>
                            handleParcelaChange(i, 'data_vencimento', e.target.value)
                          }
                          disabled={p.numero === 0}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1 block">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={p.valor}
                          onChange={(e) => handleParcelaChange(i, 'valor', e.target.value)}
                          disabled={p.numero === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          {id ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelarVenda}
              disabled={loading || formData.status_venda === 'Cancelada'}
            >
              Cancelar Venda
            </Button>
          ) : (
            <div />
          )}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-32 border-gray-300"
            >
              Voltar
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
        </div>
      </form>
    </div>
  )
}
