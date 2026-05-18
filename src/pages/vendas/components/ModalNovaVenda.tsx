import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getEventosG,
  getParceirosG,
  getAnimaisDisponiveis,
  createVendaCompleta,
} from '@/services/vendas_gestao'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function ModalNovaVenda({ open, onOpenChange, onSuccess }: any) {
  const { toast } = useToast()
  const [eventos, setEventos] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState({
    evento_id: 'none',
    cliente_id: '',
    tipo_gado: 'Comercial',
    forma_pagamento: 'AVista',
    valor_total_venda: '',
    valor_entrada: '',
    centro_custo: 'CC02',
  })
  const [parcelas, setParcelas] = useState('')

  useEffect(() => {
    if (open) {
      getEventosG().then(setEventos)
      getParceirosG().then(setParceiros)
      getAnimaisDisponiveis().then(setAnimais)
    }
  }, [open])

  const handleCreateCliente = async () => {
    const nome = prompt('Nome do novo cliente:')
    if (nome) {
      const res = await pb
        .collection('parceiros_negocios')
        .create({ nome_razao_social: nome, categoria_parceiro: 'Cliente' })
      setParceiros([...parceiros, res])
      setForm({ ...form, cliente_id: res.id })
    }
  }

  const handleSave = async () => {
    if (!form.cliente_id || !form.valor_total_venda || selected.length === 0)
      return toast({
        title: 'Preencha os campos obrigatórios e selecione animais',
        variant: 'destructive',
      })

    let finalNumeroParcelas = form.forma_pagamento === 'AVista' ? 1 : Number(parcelas)
    if (form.forma_pagamento === 'Parcelado') {
      if (
        parcelas === '' ||
        parcelas === undefined ||
        parcelas === null ||
        Number(parcelas) <= 0 ||
        !Number.isInteger(Number(parcelas))
      ) {
        return toast({
          title: 'Erro de Validação',
          description: 'Preencha o número de parcelas válido (inteiro maior que zero).',
          variant: 'destructive',
        })
      }
      finalNumeroParcelas = Number(parcelas)
    }

    try {
      const payload = {
        ...form,
        data_venda: new Date().toISOString(),
        status_venda: 'Confirmada',
        numero_parcelas: finalNumeroParcelas,
        valor_entrada: form.valor_entrada ? Number(form.valor_entrada) : 0,
      }
      if (payload.evento_id === 'none') delete payload.evento_id
      await createVendaCompleta(payload, selected, finalNumeroParcelas)
      toast({ title: 'Venda confirmada e parcelas geradas!' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Nova Venda</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 text-black">
          <Select value={form.evento_id} onValueChange={(v) => setForm({ ...form, evento_id: v })}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Evento (Opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem Evento Vinculado</SelectItem>
              {eventos.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_evento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select
              value={form.cliente_id}
              onValueChange={(v) => setForm({ ...form, cliente_id: v })}
            >
              <SelectTrigger className="flex-1 border-gray-300">
                <SelectValue placeholder="Cliente *" />
              </SelectTrigger>
              <SelectContent>
                {parceiros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleCreateCliente}
              variant="outline"
              className="border-gray-300"
            >
              +
            </Button>
          </div>
          <div className="flex gap-2">
            <Select
              value={form.tipo_gado}
              onValueChange={(v) => setForm({ ...form, tipo_gado: v })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Tipo Gado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="PO">PO</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.centro_custo}
              onValueChange={(v) => setForm({ ...form, centro_custo: v })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC01">CC01 - Nelore PO</SelectItem>
                <SelectItem value="CC02">CC02 - Comercial TIP</SelectItem>
                <SelectItem value="CC03">CC03 - Estrutural/Rateio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 col-span-2 sm:col-span-1">
            <Input
              type="number"
              placeholder="Valor Total (R$) *"
              value={form.valor_total_venda}
              onChange={(e) => setForm({ ...form, valor_total_venda: e.target.value })}
              className="border-gray-300 flex-1"
            />
            <Input
              type="number"
              placeholder="Entrada (R$)"
              value={form.valor_entrada}
              onChange={(e) => setForm({ ...form, valor_entrada: e.target.value })}
              className="border-gray-300 flex-1"
            />
          </div>

          <div className="col-span-2">
            <p className="text-sm font-medium mb-2 text-gray-700">Selecione os Animais *</p>
            <ScrollArea className="h-40 border border-gray-300 rounded p-3 bg-gray-50">
              {animais.map((a) => (
                <div key={a.id} className="flex items-center space-x-3 mb-3">
                  <Checkbox
                    id={a.id}
                    checked={selected.includes(a.id)}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...selected, a.id] : selected.filter((id) => id !== a.id))
                    }
                  />
                  <label htmlFor={a.id} className="text-sm font-medium cursor-pointer">
                    {a.id_manejo_brinco} - {a.categoria} - {a.peso_atual_kg}kg
                  </label>
                </div>
              ))}
              {animais.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum animal disponível para venda.</p>
              )}
            </ScrollArea>
          </div>

          <Select
            value={form.forma_pagamento}
            onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}
          >
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVista">À Vista</SelectItem>
              <SelectItem value="Parcelado">Parcelado</SelectItem>
            </SelectContent>
          </Select>
          {form.forma_pagamento === 'Parcelado' && (
            <Input
              type="number"
              placeholder="Nº Parcelas"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              className="border-gray-300"
            />
          )}
        </div>
        <Button
          onClick={handleSave}
          className="w-full mt-4 bg-emerald-800 hover:bg-emerald-900 text-white"
        >
          Confirmar Venda e Gerar Parcelas
        </Button>
      </DialogContent>
    </Dialog>
  )
}
