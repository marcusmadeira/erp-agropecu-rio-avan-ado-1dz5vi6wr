import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createPagamentoRealizado } from '@/services/pagamentos_realizados'
import { toast } from 'sonner'

export default function PagamentoFormDialog({ open, onOpenChange, boleto, onSuccess }: any) {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('boleto_pagar_id', boleto.id)
    try {
      await createPagamentoRealizado(formData)
      toast.success('Pagamento registrado!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data de Pagamento</Label>
            <Input
              type="date"
              name="data_pagamento"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Valor Pago (R$)</Label>
            <Input
              type="number"
              step="0.01"
              name="valor_pago"
              defaultValue={boleto?.valor || ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Input name="forma_pagamento" placeholder="Ex: PIX, Transferência, Boleto" required />
          </div>
          <div className="space-y-2">
            <Label>Comprovante (Opcional)</Label>
            <Input type="file" name="comprovante_url" />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea name="observacoes" />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#094016] text-white hover:bg-[#094016]/90"
            >
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
