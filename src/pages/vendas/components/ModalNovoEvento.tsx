import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEventoG, getUsersG } from '@/services/vendas_gestao'
import { useToast } from '@/hooks/use-toast'

export function ModalNovoEvento({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({
    nome_evento: '',
    tipo_evento: 'Leilão',
    data_evento: '',
    local: '',
    responsavel_evento: '',
    status: 'Planejado',
  })

  useEffect(() => {
    if (open) getUsersG().then(setUsers)
  }, [open])

  const handleSave = async () => {
    if (!form.nome_evento || !form.data_evento)
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
    try {
      await createEventoG({
        ...form,
        data_evento: new Date(form.data_evento).toISOString(),
        custo_total_evento: 0,
        receita_total_evento: 0,
      })
      toast({ title: 'Evento criado com sucesso' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro ao criar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Novo Evento de Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4 text-black">
          <Input
            placeholder="Nome do Evento *"
            value={form.nome_evento}
            onChange={(e) => setForm({ ...form, nome_evento: e.target.value })}
            className="border-gray-300"
          />
          <Select
            value={form.tipo_evento}
            onValueChange={(v) => setForm({ ...form, tipo_evento: v })}
          >
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Leilão">Leilão</SelectItem>
              <SelectItem value="Feira">Feira</SelectItem>
              <SelectItem value="Venda_Fazenda">Venda na Fazenda</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={form.data_evento}
            onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
            className="border-gray-300"
          />
          <Input
            placeholder="Local"
            value={form.local}
            onChange={(e) => setForm({ ...form, local: e.target.value })}
            className="border-gray-300"
          />
          <Select
            value={form.responsavel_evento}
            onValueChange={(v) => setForm({ ...form, responsavel_evento: v })}
          >
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.name || u.email}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSave}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            Salvar Evento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
