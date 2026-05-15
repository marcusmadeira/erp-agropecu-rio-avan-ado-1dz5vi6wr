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
import { Calendar } from 'lucide-react'
import { agendarProximaTentativa } from '@/services/cobrancas'
import { useToast } from '@/hooks/use-toast'

export function AgendarTentativaModal({
  parcelaId,
  onRefresh,
}: {
  parcelaId: string
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState('')
  const { toast } = useToast()

  const handleSave = async () => {
    if (!data) return
    setLoading(true)
    try {
      await agendarProximaTentativa(parcelaId, data + 'T12:00:00.000Z')
      toast({ title: 'Sucesso', description: 'Reagendamento salvo!' })
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
        <Button variant="outline" size="sm" className="w-full text-xs h-8 px-1" title="Agendar">
          <Calendar className="h-3.5 w-3.5 mr-1" /> Agendar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Próxima Tentativa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data da Próxima Cobrança</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !data}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
