import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { getPlanejamentos, savePlanejamento, deletePlanejamento } from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'

const schema = z.object({
  matriz_id: z.string().min(1, 'Matriz é obrigatória'),
  touro_opcao_1_id: z.string().optional(),
  touro_opcao_2_id: z.string().optional(),
})

export default function PlanejamentoTab({ animais }: { animais: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { matriz_id: '', touro_opcao_1_id: '', touro_opcao_2_id: '' },
  })

  const loadData = async () => {
    try {
      const items = await getPlanejamentos()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('planejamento_acasalamento', () => loadData())

  const onOpenNew = () => {
    setEditingId(null)
    form.reset({ matriz_id: '', touro_opcao_1_id: '', touro_opcao_2_id: '' })
    setOpen(true)
  }

  const onOpenEdit = (item: any) => {
    setEditingId(item.id)
    form.reset({
      matriz_id: item.matriz_id || '',
      touro_opcao_1_id: item.touro_opcao_1_id || '',
      touro_opcao_2_id: item.touro_opcao_2_id || '',
    })
    setOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await savePlanejamento(editingId, {
        matriz_id: values.matriz_id,
        touro_opcao_1_id:
          values.touro_opcao_1_id && values.touro_opcao_1_id !== 'none'
            ? values.touro_opcao_1_id
            : null,
        touro_opcao_2_id:
          values.touro_opcao_2_id && values.touro_opcao_2_id !== 'none'
            ? values.touro_opcao_2_id
            : null,
      })
      toast({ title: 'Salvo com sucesso' })
      setOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deletePlanejamento(deleteId)
      toast({ title: 'Deletado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao deletar', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Acasalamentos</h2>
        <Button onClick={onOpenNew} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Planejamento
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matriz</TableHead>
              <TableHead>Touro Opção 1</TableHead>
              <TableHead>Touro Opção 2</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onOpenEdit(item)}>
                      <Pencil className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground font-medium"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">
              {editingId ? 'Editar Planejamento' : 'Novo Planejamento'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="matriz_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Matriz</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matriz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {animais.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.id_manejo_brinco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="touro_opcao_1_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Touro Opção 1 (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o touro 1" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {animais.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.id_manejo_brinco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="touro_opcao_2_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Touro Opção 2 (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o touro 2" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {animais.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.id_manejo_brinco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white font-bold w-full mt-2"
                >
                  Salvar Registro
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(val) => !val && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 font-bold"
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
