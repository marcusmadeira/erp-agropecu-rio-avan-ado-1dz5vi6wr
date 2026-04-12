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
import { createBoletoPagar, updateBoletoPagar } from '@/services/boletos_pagar'
import { getDespesas } from '@/services/despesas'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function BoletoFormDialog({ open, onOpenChange, initialData, onSuccess }: any) {
  const [despesas, setDespesas] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getDespesas()
        .then(setDespesas)
        .catch(() => {})
      pb.collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro='Fornecedor'" })
        .then(setFornecedores)
        .catch(() => {})
    }
  }, [open])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    if (data.despesa_id === 'none') data.despesa_id = ''
    try {
      if (initialData) await updateBoletoPagar(initialData.id, data)
      else await createBoletoPagar(data)
      toast.success('Boleto salvo com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao salvar boleto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Boleto' : 'Novo Boleto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Despesa Ref.</Label>
              <Select name="despesa_id" defaultValue={initialData?.despesa_id || 'none'}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {despesas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.tipo_despesa} - R$ {d.valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select name="fornecedor_id" defaultValue={initialData?.fornecedor_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome_razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nº do Boleto</Label>
              <Input name="numero_boleto" defaultValue={initialData?.numero_boleto || ''} />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                name="valor"
                defaultValue={initialData?.valor || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                name="data_vencimento"
                defaultValue={initialData?.data_vencimento?.split('T')[0] || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={initialData?.status || 'Pendente'} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
