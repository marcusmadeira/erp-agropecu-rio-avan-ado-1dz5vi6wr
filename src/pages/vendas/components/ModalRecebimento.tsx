import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function ModalRecebimento({ open, onOpenChange, boleto, onSuccess }: any) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    data_recebimento: new Date().toISOString().split('T')[0],
    valor_recebido: '',
    forma_recebimento: 'Transferencia',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.data_recebimento || !form.valor_recebido) {
      return toast({ title: 'Preencha data e valor', variant: 'destructive' })
    }
    setLoading(true)
    try {
      await pb.collection('recebimentos_vendas').create({
        boleto_id: boleto.id,
        venda_id: boleto.venda_id || boleto.expand?.parcela_id?.venda_id,
        data_recebimento: new Date(form.data_recebimento).toISOString(),
        valor_recebido: Number(form.valor_recebido),
        forma_recebimento: form.forma_recebimento,
        observacoes: form.observacoes,
        usuario_id: pb.authStore.record?.id,
      })

      await pb.collection('boletos').update(boleto.id, {
        status_boleto: 'Pago',
        data_pagamento: new Date(form.data_recebimento).toISOString(),
        valor_pago: Number(form.valor_recebido),
      })

      if (boleto.parcela_id) {
        await pb.collection('parcelas_venda').update(boleto.parcela_id, {
          status_parcela: 'Paga',
          data_pagamento: new Date(form.data_recebimento).toISOString(),
        })
      }

      toast({ title: 'Recebimento registrado com sucesso!' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">
            Registrar Recebimento - {boleto?.numero_boleto}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-black">
          <div>
            <label className="text-sm font-medium">Data do Recebimento</label>
            <Input
              type="date"
              value={form.data_recebimento}
              onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
              className="border-gray-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Valor Recebido (R$)</label>
            <Input
              type="number"
              step="0.01"
              value={form.valor_recebido}
              onChange={(e) => setForm({ ...form, valor_recebido: e.target.value })}
              placeholder={boleto?.valor_boleto}
              className="border-gray-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Forma de Recebimento</label>
            <Select
              value={form.forma_recebimento}
              onValueChange={(v) => setForm({ ...form, forma_recebimento: v })}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Transferencia">Transferência/PIX</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Input
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="border-gray-300"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            Confirmar Recebimento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
