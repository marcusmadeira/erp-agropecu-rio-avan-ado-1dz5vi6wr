import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { registrarBaixaManual } from '@/services/cobrancas'
import { useToast } from '@/hooks/use-toast'

export function BaixaManualModal({ parcela, onRefresh }: { parcela: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forma, setForma] = useState('PIX')
  const [dataPag, setDataPag] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    try {
      await registrarBaixaManual({
        parcela_id: parcela.id,
        venda_id: parcela.venda_id,
        valor_pago: parcela.valor_parcela,
        data_pagamento: dataPag + 'T12:00:00.000Z',
        forma_pagamento: forma,
        observacoes: obs,
      })
      toast({ title: 'Sucesso', description: 'Baixa realizada com sucesso!' })
      setOpen(false)
      onRefresh()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="w-full text-xs h-8 px-1 bg-emerald-600 hover:bg-emerald-700"
          title="Marcar como Pago"
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Baixa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixa Manual de Parcela</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <strong>Valor da Parcela:</strong>{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              parcela.valor_parcela,
            )}
          </div>
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="TED">TED</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Recebimento</Label>
            <Input type="date" value={dataPag} onChange={(e) => setDataPag(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Notas internas..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Confirmar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
