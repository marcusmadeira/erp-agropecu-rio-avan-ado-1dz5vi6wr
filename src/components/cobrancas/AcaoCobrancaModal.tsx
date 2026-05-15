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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageCircle } from 'lucide-react'
import { registrarAcaoCobranca } from '@/services/cobrancas'
import { useToast } from '@/hooks/use-toast'

export function AcaoCobrancaModal({
  parcela,
  clienteId,
  onRefresh,
}: {
  parcela: any
  clienteId: string
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('WhatsApp')
  const [status, setStatus] = useState('Enviado')
  const [resultado, setResultado] = useState('')
  const { toast } = useToast()

  const handleSave = async () => {
    if (!clienteId) {
      toast({ title: 'Erro', description: 'Cliente não encontrado.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await registrarAcaoCobranca({
        parcela_id: parcela.id,
        cliente_id: clienteId,
        tipo_cobranca: tipo,
        status_cobranca: status,
        resultado,
      })
      toast({ title: 'Sucesso', description: 'Ação registrada com sucesso!' })
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
          variant="outline"
          size="sm"
          className="w-full text-xs h-8 px-1"
          title="Registrar Ação"
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1" /> Ação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Ação de Cobrança</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Cobrança</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Pessoal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status / Conclusão</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Lido">Lido</SelectItem>
                <SelectItem value="Respondido">Respondido</SelectItem>
                <SelectItem value="Sem_Resposta">Sem Resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem Enviada / Resultado</Label>
            <Textarea
              placeholder="Ex: Prometeu pagar amanhã..."
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
