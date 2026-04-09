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
import { getIatfs, saveIatf, deleteIatf } from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

const schema = z.object({
  matriz_id: z.string().min(1, 'Matriz é obrigatória'),
  data_iatf: z.string().min(1, 'Data IATF é obrigatória'),
  touro_utilizado_id: z.string().optional(),
  resultado_dg: z.string().optional(),
  data_provavel_parto_dpp: z.string().optional(),
})

export default function IatfTab({ animais }: { animais: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      matriz_id: '',
      data_iatf: '',
      touro_utilizado_id: '',
      resultado_dg: '',
      data_provavel_parto_dpp: '',
    },
  })

  const loadData = async () => {
    try {
      const items = await getIatfs()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('manejo_iatf_curral', () => loadData())

  const onOpenNew = () => {
    setEditingId(null)
    form.reset({
      matriz_id: '',
      data_iatf: new Date().toISOString().split('T')[0],
      touro_utilizado_id: '',
      resultado_dg: '',
      data_provavel_parto_dpp: '',
    })
    setOpen(true)
  }

  const onOpenEdit = (item: any) => {
    setEditingId(item.id)
    form.reset({
      matriz_id: item.matriz_id || '',
      data_iatf: item.data_iatf ? item.data_iatf.split(' ')[0] : '',
      touro_utilizado_id: item.touro_utilizado_id || '',
      resultado_dg: item.resultado_dg || '',
      data_provavel_parto_dpp: item.data_provavel_parto_dpp
        ? item.data_provavel_parto_dpp.split(' ')[0]
        : '',
    })
    setOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await saveIatf(editingId, {
        matriz_id: values.matriz_id,
        data_iatf: values.data_iatf ? `${values.data_iatf}T12:00:00.000Z` : null,
        touro_utilizado_id:
          values.touro_utilizado_id && values.touro_utilizado_id !== 'none'
            ? values.touro_utilizado_id
            : null,
        resultado_dg:
          values.resultado_dg && values.resultado_dg !== 'none' ? values.resultado_dg : null,
        data_provavel_parto_dpp: values.data_provavel_parto_dpp
          ? `${values.data_provavel_parto_dpp}T12:00:00.000Z`
          : null,
      })
      toast({ title: 'Salvo com sucesso' })
      setOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const exportColumns = [
    { header: 'Matriz', dataKey: (r: any) => r.expand?.matriz_id?.id_manejo_brinco || '-' },
    {
      header: 'Data IATF',
      dataKey: (r: any) =>
        r.data_iatf ? format(new Date(r.data_iatf.replace(' ', 'T')), 'dd/MM/yyyy') : '-',
    },
    {
      header: 'Touro Utilizado',
      dataKey: (r: any) => r.expand?.touro_utilizado_id?.id_manejo_brinco || '-',
    },
    { header: 'Resultado DG', dataKey: 'resultado_dg' },
    {
      header: 'DPP',
      dataKey: (r: any) =>
        r.data_provavel_parto_dpp
          ? format(new Date(r.data_provavel_parto_dpp.replace(' ', 'T')), 'dd/MM/yyyy')
          : '-',
    },
  ]

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteIatf(deleteId)
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
        <h2 className="text-xl font-bold text-primary">Manejo IATF</h2>
        <div className="flex items-center gap-2">
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Manejo IATF',
                data,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Manejo IATF',
                data,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
          <Button
            onClick={onOpenNew}
            className="bg-primary hover:bg-primary/90 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Manejo IATF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matriz</TableHead>
              <TableHead>Data IATF</TableHead>
              <TableHead>Touro Utilizado</TableHead>
              <TableHead>Resultado DG</TableHead>
              <TableHead>DPP</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-primary">
                  {item.expand?.matriz_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>
                  {item.data_iatf
                    ? format(new Date(item.data_iatf.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{item.expand?.touro_utilizado_id?.id_manejo_brinco || '-'}</TableCell>
                <TableCell>
                  {item.resultado_dg === 'Prenhe' ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                      Prenhe
                    </span>
                  ) : item.resultado_dg === 'Vazia' ? (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-bold">
                      Vazia
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {item.data_provavel_parto_dpp
                    ? format(new Date(item.data_provavel_parto_dpp.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
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
                  colSpan={6}
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {editingId ? 'Editar Manejo IATF' : 'Novo Manejo IATF'}
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
                name="data_iatf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Data IATF</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="touro_utilizado_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Touro Utilizado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o touro" />
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="resultado_dg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Resultado DG</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="Prenhe">Prenhe</SelectItem>
                          <SelectItem value="Vazia">Vazia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_provavel_parto_dpp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">DPP (Previsão)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
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
