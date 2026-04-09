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
import { createBoleto, updateBoleto } from '@/services/financeiro_vendas'
import { useToast } from '@/hooks/use-toast'

export default function BoletoDialog({ open, onOpenChange, parcelaId, editData }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    numero_boleto: '',
    codigo_barras: '',
    data_emissao: '',
    data_vencimento: '',
    valor_boleto: '',
    banco_emissor: '',
    status_boleto: 'Gerado',
    url_boleto_pdf: '',
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        data_emissao: editData.data_emissao ? editData.data_emissao.split('T')[0] : '',
        data_vencimento: editData.data_vencimento ? editData.data_vencimento.split('T')[0] : '',
      })
    } else {
      setFormData({
        numero_boleto: '',
        codigo_barras: '',
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: '',
        valor_boleto: '',
        banco_emissor: '',
        status_boleto: 'Gerado',
        url_boleto_pdf: '',
      })
    }
  }, [editData, open])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        parcela_id: parcelaId,
        data_emissao: formData.data_emissao ? new Date(formData.data_emissao).toISOString() : null,
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento).toISOString()
          : null,
      }

      if (editData) await updateBoleto(editData.id, payload)
      else await createBoleto(payload)

      toast({ title: 'Boleto salvo com sucesso' })
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
          <DialogTitle>{editData ? 'Editar Boleto' : 'Novo Boleto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº do Boleto</Label>
              <Input
                required
                value={formData.numero_boleto}
                onChange={(e) => setFormData({ ...formData, numero_boleto: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.valor_boleto}
                onChange={(e) => setFormData({ ...formData, valor_boleto: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Código de Barras</Label>
              <Input
                value={formData.codigo_barras}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Banco Emissor</Label>
              <Input
                value={formData.banco_emissor}
                onChange={(e) => setFormData({ ...formData, banco_emissor: e.target.value })}
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
              <Label>Emissão</Label>
              <Input
                type="date"
                required
                value={formData.data_emissao}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
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
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>URL do PDF</Label>
              <Input
                type="url"
                value={formData.url_boleto_pdf}
                onChange={(e) => setFormData({ ...formData, url_boleto_pdf: e.target.value })}
              />
            </div>
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
