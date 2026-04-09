import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getEstoqueSemenList,
  createEstoqueSemen,
  updateEstoqueSemen,
  deleteEstoqueSemen,
  type EstoqueSemen,
} from '@/services/estoque_semen'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Plus } from 'lucide-react'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export function SemenTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 3

  const [items, setItems] = useState<EstoqueSemen[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await getEstoqueSemenList()
      setItems(data)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar sêmen', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('estoque_semen', () => {
    load()
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<EstoqueSemen | null>(null)
  const [form, setForm] = useState<Partial<EstoqueSemen>>({})

  const handleOpenDialog = (item?: EstoqueSemen) => {
    if (item) {
      setEditingItem(item)
      setForm(item)
    } else {
      setEditingItem(null)
      setForm({ touro_doador: '', botijao_armazenado: '', doses_palhetas_disponiveis: 0 })
    }
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem?.id) {
        await updateEstoqueSemen(editingItem.id, form)
        toast({ title: 'Sucesso', description: 'Estoque atualizado' })
      } else {
        await createEstoqueSemen(form as EstoqueSemen)
        toast({ title: 'Sucesso', description: 'Estoque criado' })
      }
      setDialogOpen(false)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar', variant: 'destructive' })
    }
  }

  const exportColumns = [
    { header: 'Touro Doador', dataKey: 'touro_doador' },
    { header: 'Botijão Armazenado', dataKey: 'botijao_armazenado' },
    { header: 'Doses Disponíveis', dataKey: 'doses_palhetas_disponiveis' },
  ]

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteEstoqueSemen(deleteId)
      toast({ title: 'Sucesso', description: 'Registro removido' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card className="shadow-subtle border-none">
        <CardHeader className="flex flex-row justify-between items-center bg-slate-50 border-b">
          <CardTitle className="text-lg text-slate-800">Estoque de Sêmen</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButtons
              onExportPDF={() =>
                exportToPDF({
                  title: 'Estoque de Sêmen',
                  data: items,
                  columns: exportColumns,
                  userName: user?.name || '',
                })
              }
              onExportExcel={() =>
                exportToExcel({
                  title: 'Estoque de Sêmen',
                  data: items,
                  columns: exportColumns,
                  userName: user?.name || '',
                })
              }
            />
            {canEdit && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Sêmen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Touro Doador</TableHead>
                <TableHead>Botijão Armazenado</TableHead>
                <TableHead className="text-right">Doses/Palhetas Disponíveis</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">{item.touro_doador}</TableCell>
                  <TableCell>{item.botijao_armazenado || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {item.doses_palhetas_disponiveis}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Edit className="w-4 h-4 text-slate-500 hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id!)}>
                        <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Sêmen' : 'Novo Sêmen'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Touro Doador</Label>
              <Input
                value={form.touro_doador || ''}
                onChange={(e) => setForm({ ...form, touro_doador: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Botijão Armazenado</Label>
                <Input
                  value={form.botijao_armazenado || ''}
                  onChange={(e) => setForm({ ...form, botijao_armazenado: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Doses Disponíveis</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.doses_palhetas_disponiveis ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, doses_palhetas_disponiveis: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
