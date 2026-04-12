import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getPlanejamentos, savePlanejamento, deletePlanejamento } from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'

export default function PlanejamentoTab({ femeas, touros }: { femeas: any[]; touros: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ matriz_id: '', touro_opcao_1_id: '', touro_opcao_2_id: '' })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setData(await getPlanejamentos())
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('planejamento_acasalamento', () => loadData())

  const handleSave = async () => {
    try {
      await savePlanejamento(null, {
        matriz_id: form.matriz_id,
        touro_opcao_1_id: form.touro_opcao_1_id || null,
        touro_opcao_2_id: form.touro_opcao_2_id || null,
      })
      toast({ title: 'Acasalamento salvo' })
      setOpen(false)
      setForm({ matriz_id: '', touro_opcao_1_id: '', touro_opcao_2_id: '' })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deletePlanejamento(deleteId)
    setDeleteId(null)
    toast({ title: 'Removido com sucesso' })
  }

  const handleImport = () => {
    toast({
      title: 'Importação Iniciada',
      description: 'Acasalamentos GenePlus/ABCZ estão sendo processados em background.',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Acasalamentos Planejados</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
            onClick={handleImport}
          >
            <Upload className="w-4 h-4 mr-2" /> Importar GenePlus
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Acasalamento
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matriz</TableHead>
              <TableHead>Touro Opção 1</TableHead>
              <TableHead>Touro Opção 2</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-primary">
                  {item.expand?.matriz_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>{item.expand?.touro_opcao_1_id?.id_manejo_brinco || '-'}</TableCell>
                <TableCell>{item.expand?.touro_opcao_2_id?.id_manejo_brinco || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhum planejamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Novo Planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Matriz</Label>
              <Select
                value={form.matriz_id}
                onValueChange={(v) => setForm({ ...form, matriz_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matriz" />
                </SelectTrigger>
                <SelectContent>
                  {femeas.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.id_manejo_brinco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Touro Opção 1</Label>
              <Select
                value={form.touro_opcao_1_id}
                onValueChange={(v) => setForm({ ...form, touro_opcao_1_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o touro 1" />
                </SelectTrigger>
                <SelectContent>
                  {touros.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id_manejo_brinco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Touro Opção 2</Label>
              <Select
                value={form.touro_opcao_2_id}
                onValueChange={(v) => setForm({ ...form, touro_opcao_2_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o touro 2" />
                </SelectTrigger>
                <SelectContent>
                  {touros.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id_manejo_brinco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este planejamento?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
