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
import {
  createTransacaoFinanceira,
  updateTransacaoFinanceira,
  TransacaoFinanceira,
} from '@/services/transacoes_financeiras'
import { getParceiros } from '@/services/parceiros_negocios'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface TransacaoFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: TransacaoFinanceira
}

export function TransacaoFormModal({ open, onOpenChange, item }: TransacaoFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Partial<TransacaoFinanceira>>({
    data_competencia: new Date().toISOString().split('T')[0],
    data_vencimento: new Date().toISOString().split('T')[0],
    data_efetivacao_real: '',
    descricao_lancamento: '',
    parceiro_id: '',
    tipo_movimento: 'Despesa',
    classificacao_custo: 'VARIÁVEL',
    centro_custo: 'CC01',
    valor_total: 0,
    status_pagamento: 'Pendente',
  })

  useEffect(() => {
    if (open) {
      getParceiros().then(setParceiros).catch(console.error)
      setErrors({})
      if (item) {
        setFormData({
          ...item,
          data_competencia: item.data_competencia.split('T')[0],
          data_vencimento: item.data_vencimento.split('T')[0],
          data_efetivacao_real: item.data_efetivacao_real
            ? item.data_efetivacao_real.split('T')[0]
            : '',
        })
      } else {
        setFormData({
          data_competencia: new Date().toISOString().split('T')[0],
          data_vencimento: new Date().toISOString().split('T')[0],
          data_efetivacao_real: '',
          descricao_lancamento: '',
          parceiro_id: '',
          tipo_movimento: 'Despesa',
          classificacao_custo: 'VARIÁVEL',
          centro_custo: 'CC01',
          valor_total: 0,
          status_pagamento: 'Pendente',
        })
      }
    }
  }, [open, item])

  const handleChange = (field: keyof TransacaoFinanceira, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const dataToSave = {
        ...formData,
        valor_total: Number(formData.valor_total),
        data_competencia: new Date(formData.data_competencia + 'T12:00:00Z').toISOString(),
        data_vencimento: new Date(formData.data_vencimento + 'T12:00:00Z').toISOString(),
        data_efetivacao_real: formData.data_efetivacao_real
          ? new Date(formData.data_efetivacao_real + 'T12:00:00Z').toISOString()
          : '',
      } as TransacaoFinanceira

      if (!dataToSave.data_efetivacao_real) {
        delete dataToSave.data_efetivacao_real
      }

      if (item?.id) {
        await updateTransacaoFinanceira(item.id, dataToSave)
        toast({ title: 'Transação atualizada com sucesso' })
      } else {
        await createTransacaoFinanceira(dataToSave)
        toast({ title: 'Transação criada com sucesso' })
      }
      onOpenChange(false)
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">
            {item ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Movimento</Label>
              <Select
                value={formData.tipo_movimento}
                onValueChange={(v) => handleChange('tipo_movimento', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.valor_total}
                onChange={(e) => handleChange('valor_total', e.target.value)}
              />
              {errors.valor_total && (
                <p className="text-xs text-destructive">{errors.valor_total}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              required
              value={formData.descricao_lancamento}
              onChange={(e) => handleChange('descricao_lancamento', e.target.value)}
            />
            {errors.descricao_lancamento && (
              <p className="text-xs text-destructive">{errors.descricao_lancamento}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Parceiro</Label>
            <Select
              value={formData.parceiro_id}
              onValueChange={(v) => handleChange('parceiro_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {parceiros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parceiro_id && <p className="text-xs text-destructive">{errors.parceiro_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Select
                value={formData.classificacao_custo}
                onValueChange={(v) => handleChange('classificacao_custo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXA">FIXA</SelectItem>
                  <SelectItem value="VARIÁVEL">VARIÁVEL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <Select
                value={formData.centro_custo}
                onValueChange={(v) => handleChange('centro_custo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC01">CC01</SelectItem>
                  <SelectItem value="CC02">CC02</SelectItem>
                  <SelectItem value="CC03">CC03</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Competência</Label>
              <Input
                type="date"
                required
                value={formData.data_competencia}
                onChange={(e) => handleChange('data_competencia', e.target.value)}
              />
              {errors.data_competencia && (
                <p className="text-xs text-destructive">{errors.data_competencia}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                required
                value={formData.data_vencimento}
                onChange={(e) => handleChange('data_vencimento', e.target.value)}
              />
              {errors.data_vencimento && (
                <p className="text-xs text-destructive">{errors.data_vencimento}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status_pagamento}
                onValueChange={(v) => handleChange('status_pagamento', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Efetivação (Opcional)</Label>
              <Input
                type="date"
                value={formData.data_efetivacao_real || ''}
                onChange={(e) => handleChange('data_efetivacao_real', e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Transação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
