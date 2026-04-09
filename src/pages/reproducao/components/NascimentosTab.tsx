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
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { getNascimentos, saveNascimento, deleteNascimento } from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

const schema = z.object({
  matriz_mae_id: z.string().min(1, 'Matriz mãe é obrigatória'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.string().optional(),
  peso_nascer: z.number().optional(),
  status_cria: z.string().optional(),
  rgn_provisorio_abcz: z.string().optional(),
})

export default function NascimentosTab({ animais }: { animais: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      matriz_mae_id: '',
      data_nascimento: '',
      sexo: '',
      peso_nascer: undefined,
      status_cria: '',
      rgn_provisorio_abcz: '',
    },
  })

  const loadData = async () => {
    try {
      const items = await getNascimentos()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('nascimentos_e_desmama', () => loadData())

  const onOpenNew = () => {
    setEditingId(null)
    form.reset({
      matriz_mae_id: '',
      data_nascimento: new Date().toISOString().split('T')[0],
      sexo: '',
      peso_nascer: undefined,
      status_cria: '',
      rgn_provisorio_abcz: '',
    })
    setOpen(true)
  }

  const onOpenEdit = (item: any) => {
    setEditingId(item.id)
    form.reset({
      matriz_mae_id: item.matriz_mae_id || '',
      data_nascimento: item.data_nascimento ? item.data_nascimento.split(' ')[0] : '',
      sexo: item.sexo || '',
      peso_nascer: item.peso_nascer || undefined,
      status_cria: item.status_cria || '',
      rgn_provisorio_abcz: item.rgn_provisorio_abcz || '',
    })
    setOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await saveNascimento(editingId, {
        matriz_mae_id: values.matriz_mae_id,
        data_nascimento: values.data_nascimento ? `${values.data_nascimento}T12:00:00.000Z` : null,
        sexo: values.sexo && values.sexo !== 'none' ? values.sexo : null,
        peso_nascer: values.peso_nascer || null,
        status_cria: values.status_cria || null,
        rgn_provisorio_abcz: values.rgn_provisorio_abcz || null,
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
      await deleteNascimento(deleteId)
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
        <h2 className="text-xl font-bold text-primary">Nascimentos e Desmama</h2>
        <Button onClick={onOpenNew} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Nascimento
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matriz Mãe</TableHead>
              <TableHead>Data Nascimento</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Peso Nascer</TableHead>
              <TableHead>Status Cria</TableHead>
              <TableHead>RGN Prov.</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-primary">
                  {item.expand?.matriz_mae_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>
                  {item.data_nascimento
                    ? format(new Date(item.data_nascimento.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {item.sexo === 'Macho' ? (
                    <span className="text-blue-600 font-bold">Macho</span>
                  ) : item.sexo === 'Fêmea' ? (
                    <span className="text-pink-600 font-bold">Fêmea</span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{item.peso_nascer ? `${item.peso_nascer} kg` : '-'}</TableCell>
                <TableCell>{item.status_cria || '-'}</TableCell>
                <TableCell>{item.rgn_provisorio_abcz || '-'}</TableCell>
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
                  colSpan={7}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {editingId ? 'Editar Nascimento' : 'Novo Nascimento'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matriz_mae_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Matriz Mãe</FormLabel>
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
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Data Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sexo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Sexo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="Macho">Macho</SelectItem>
                          <SelectItem value="Fêmea">Fêmea</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peso_nascer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Peso ao Nascer (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status_cria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Status Cria</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Saudável, Vivo"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rgn_provisorio_abcz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">RGN Prov. ABCZ</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
