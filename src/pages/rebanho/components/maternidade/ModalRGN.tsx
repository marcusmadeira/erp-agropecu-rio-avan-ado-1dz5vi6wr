import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateRegistroRGN } from '@/services/maternidade'
import { toast } from '@/hooks/use-toast'

export function ModalRGN({
  registro,
  onClose,
  onSuccess,
}: {
  registro: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [rgn, setRgn] = useState('')

  const handleSave = async () => {
    if (!rgn) return toast({ title: 'Informe o RGN', variant: 'destructive' })
    try {
      await updateRegistroRGN(registro.id, rgn)
      toast({ title: 'RGN registrado' })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao registrar RGN', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!registro} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#094016]">Registrar RGN ABCZ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bezerro</Label>
            <Input disabled value={registro?.numero_tatuagem || ''} />
          </div>
          <div className="space-y-2">
            <Label>Número do RGN Definitivo</Label>
            <Input
              value={rgn}
              onChange={(e) => setRgn(e.target.value)}
              placeholder="Ex: ABCZ12345"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-[#094016] hover:bg-[#094016]/90 text-white w-full"
          >
            Confirmar RGN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
