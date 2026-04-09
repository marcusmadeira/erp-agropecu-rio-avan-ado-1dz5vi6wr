import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { createParcela, updateParcela } from '@/services/financeiro_vendas'
import { useToast } from '@/hooks/use-toast'

export default function ParcelaDialog({ open, onOpenChange, vendaId, editData }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    numero_parcela: '',
    valor_parcela: '',
    data_vencimento: '',
    data_pagamento: '',
    status_parcela: 'Pendente',
    juros_atraso: 0,
    multa_atraso: 0,
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        data_vencimento: editData.data_vencimento ? editData.data_vencimento.split('T')[0] : '',
        data_pagamento: editData.data_pagamento ? editData.data_pagamento.split('T')[0] : '',
      })
    } else {
      setFormData({
        numero_parcela: '',
        valor_parcela: '',
        data_vencimento: '',
        data_pagamento: '',
        status_parcela: 'Pendente',
        juros_atraso: 0,
        multa_atraso: 0,
      })
    }
  }, [editData, open])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        venda_id: vendaId,
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento).toISOString()
          : null,
        data_pagamento: formData.data_pagamento
          ? new Date(formData.data_pagamento).toISOString()
          : null,
      }
      if (!payload.data_pagamento) delete payload.data_pagamento

      if (editData) await updateParcela(editData.id, payload)
      else await createParcela(payload)

      toast({ title: 'Parcela salva com sucesso' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Parcela' : 'Nova Parcela'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº da Parcela *</Label>
              <Input
                type="number"
                required
                value={formData.numero_parcela}
                onChange={(e) => setFormData({ ...formData, numero_parcela: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.valor_parcela}
                onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento *</Label>
              <Input
                type="date"
                required
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Input
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Status</Label>
              <Select
                value={formData.status_parcela}
                onValueChange={(v) => setFormData({ ...formData, status_parcela: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Paga">Paga</SelectItem>
                  <SelectItem value="Atrasada">Atrasada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status_parcela === 'Atrasada' && (
              <>
                <div className="space-y-2">
                  <Label>Juros (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.juros_atraso}
                    onChange={(e) => setFormData({ ...formData, juros_atraso: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multa (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.multa_atraso}
                    onChange={(e) => setFormData({ ...formData, multa_atraso: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
