import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  createBoleto,
  updateBoleto,
  getParcelas,
  getParceiros,
  getVendas,
} from '@/services/financeiro_recebimentos'
import { useToast } from '@/hooks/use-toast'

export default function BoletoForm({ open, onOpenChange, boleto, onSuccess }: any) {
  const [clientes, setClientes] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [parcelas, setParcelas] = useState<any[]>([])

  const [clienteId, setClienteId] = useState('')
  const [vendaId, setVendaId] = useState('')

  const [formData, setFormData] = useState({
    parcela_id: '',
    numero_boleto: '',
    valor_boleto: 0,
    data_vencimento: '',
    status_boleto: 'Pendente',
    data_pagamento: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      Promise.all([getParceiros(), getVendas(), getParcelas()]).then(([cls, vnds, prcs]) => {
        setClientes(cls)
        setVendas(vnds)
        setParcelas(prcs)
      })
      if (boleto) {
        const vId = boleto.expand?.parcela_id?.venda_id
        const cId = boleto.expand?.parcela_id?.expand?.venda_id?.cliente_id
        setClienteId(cId || '')
        setVendaId(vId || '')

        setFormData({
          parcela_id: boleto.parcela_id || '',
          numero_boleto: boleto.numero_boleto || '',
          valor_boleto: boleto.valor_boleto || 0,
          data_vencimento: boleto.data_vencimento ? boleto.data_vencimento.split('T')[0] : '',
          status_boleto: boleto.status_boleto || 'Pendente',
          data_pagamento: boleto.data_pagamento ? boleto.data_pagamento.split('T')[0] : '',
        })
      } else {
        setClienteId('')
        setVendaId('')
        setFormData({
          parcela_id: '',
          numero_boleto: '',
          valor_boleto: 0,
          data_vencimento: '',
          status_boleto: 'Pendente',
          data_pagamento: '',
        })
      }
    }
  }, [open, boleto])

  const handleSubmit = async () => {
    try {
      const data = { ...formData, valor_boleto: Number(formData.valor_boleto) }
      if (!data.data_pagamento) delete data.data_pagamento

      if (boleto?.id) {
        await updateBoleto(boleto.id, data)
        toast({ title: 'Boleto atualizado' })
      } else {
        await createBoleto(data)
        toast({ title: 'Boleto criado' })
      }
      onSuccess()
    } catch {
      toast({ title: 'Erro ao salvar boleto', variant: 'destructive' })
    }
  }

  const vendasFiltradas = vendas.filter((v) => v.cliente_id === clienteId)
  const parcelasFiltradas = parcelas.filter((p) => p.venda_id === vendaId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{boleto ? 'Editar Boleto' : 'Novo Boleto'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={clienteId}
              onValueChange={(v) => {
                setClienteId(v)
                setVendaId('')
                setFormData({ ...formData, parcela_id: '' })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
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
            <Label>Venda Referência</Label>
            <Select
              value={vendaId}
              onValueChange={(v) => {
                setVendaId(v)
                setFormData({ ...formData, parcela_id: '' })
              }}
              disabled={!clienteId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a venda" />
              </SelectTrigger>
              <SelectContent>
                {vendasFiltradas.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    Venda de {v.data_venda?.split('T')[0]} - {v.tipo_gado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Parcela Vinculada</Label>
            <Select
              value={formData.parcela_id}
              onValueChange={(v) => setFormData({ ...formData, parcela_id: v })}
              disabled={!vendaId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a parcela" />
              </SelectTrigger>
              <SelectContent>
                {parcelasFiltradas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Parc {p.numero_parcela} (R$ {p.valor_parcela})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número do Boleto</Label>
              <Input
                value={formData.numero_boleto}
                onChange={(e) => setFormData({ ...formData, numero_boleto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={formData.valor_boleto}
                onChange={(e) => setFormData({ ...formData, valor_boleto: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status_boleto}
                onValueChange={(v) => setFormData({ ...formData, status_boleto: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gerado">Gerado</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.status_boleto === 'Pago' && (
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="bg-[#094016] text-white hover:bg-[#094016]/90">
            Salvar Cadastro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
