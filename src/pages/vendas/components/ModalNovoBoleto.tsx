import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getParcelasSemBoleto, gerarBoletoParaParcela } from '@/services/vendas_gestao'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function ModalNovoBoleto({ open, onOpenChange, onSuccess }: any) {
  const [parcelas, setParcelas] = useState<any[]>([])
  const [selected, setSelected] = useState('none')
  const { toast } = useToast()

  useEffect(() => {
    if (open) getParcelasSemBoleto().then(setParcelas)
  }, [open])

  const handleSave = async () => {
    if (selected === 'none') return
    const p = parcelas.find((x) => x.id === selected)
    try {
      await gerarBoletoParaParcela(p.id, p.valor_parcela, p.data_vencimento)
      toast({ title: 'Boleto gerado com sucesso' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Gerar Novo Boleto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4 text-black">
          <p className="text-sm text-gray-600">
            Selecione uma parcela pendente que ainda não possui boleto gerado:
          </p>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Selecione a Parcela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                Selecione uma parcela
              </SelectItem>
              {parcelas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'Desconhecido'} -
                  Venc: {format(new Date(p.data_vencimento), 'dd/MM')} - R$ {p.valor_parcela}
                </SelectItem>
              ))}
              {parcelas.length === 0 && (
                <SelectItem value="empty" disabled>
                  Nenhuma parcela disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSave}
            disabled={selected === 'none'}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            Confirmar e Gerar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
