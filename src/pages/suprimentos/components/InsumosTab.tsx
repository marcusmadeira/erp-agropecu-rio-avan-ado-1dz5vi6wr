import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getEstoqueInsumos,
  createEstoqueInsumo,
  updateEstoqueInsumo,
  deleteEstoqueInsumo,
  type EstoqueInsumo,
} from '@/services/estoque_insumos'
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
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export function InsumosTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 3

  const [items, setItems] = useState<EstoqueInsumo[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await getEstoqueInsumos()
      setItems(data)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar insumos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('estoque_insumos', () => {
    load()
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<EstoqueInsumo | null>(null)
  const [form, setForm] = useState<Partial<EstoqueInsumo>>({})

  const handleOpenDialog = (item?: EstoqueInsumo) => {
    if (item) {
      setEditingItem(item)
      setForm(item)
    } else {
      setEditingItem(null)
      setForm({
        produto: '',
        quantidade_atual: 0,
        unidade_medida: 'Kg',
        custo_medio_unitario: 0,
        estoque_minimo_critico: 0,
        consumo_medio_diario: 0,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem?.id) {
        await updateEstoqueInsumo(editingItem.id, form)
        toast({ title: 'Sucesso', description: 'Insumo atualizado' })
      } else {
        await createEstoqueInsumo(form as EstoqueInsumo)
        toast({ title: 'Sucesso', description: 'Insumo criado' })
      }
      setDialogOpen(false)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar', variant: 'destructive' })
    }
  }

  const exportColumns = [
    { header: 'Produto', dataKey: 'produto' },
    { header: 'Qtd. Atual', dataKey: 'quantidade_atual' },
    { header: 'Unidade', dataKey: 'unidade_medida' },
    { header: 'Custo Unit.', dataKey: 'custo_medio_unitario' },
    { header: 'Mínimo', dataKey: 'estoque_minimo_critico' },
    { header: 'Consumo/Dia', dataKey: 'consumo_medio_diario' },
  ]

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteEstoqueInsumo(deleteId)
      toast({ title: 'Sucesso', description: 'Insumo removido' })
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
          <CardTitle className="text-lg text-slate-800">Insumos Cadastrados</CardTitle>
          <div className="flex items-center gap-2">
            <ExportButtons
              onExportPDF={() =>
                exportToPDF({
                  title: 'Estoque de Insumos',
                  data: items,
                  columns: exportColumns,
                  userName: user?.name || '',
                })
              }
              onExportExcel={() =>
                exportToExcel({
                  title: 'Estoque de Insumos',
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
                <Plus className="w-4 h-4 mr-2" /> Novo Insumo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd. Atual</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Consumo/Dia</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCritical = item.quantidade_atual <= (item.estoque_minimo_critico || 0)
                return (
                  <TableRow
                    key={item.id}
                    className={isCritical ? 'bg-rose-50 hover:bg-rose-100' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isCritical && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                        <span className={isCritical ? 'text-rose-700' : ''}>{item.produto}</span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${isCritical ? 'text-rose-600' : ''}`}
                    >
                      {item.quantidade_atual}
                    </TableCell>
                    <TableCell>{item.unidade_medida}</TableCell>
                    <TableCell className="text-right">
                      {item.custo_medio_unitario
                        ? `R$ ${item.custo_medio_unitario.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.estoque_minimo_critico ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.consumo_medio_diario ?? '-'}</TableCell>
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
                )
              })}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhum insumo encontrado.
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
            <DialogTitle>{editingItem ? 'Editar Insumo' : 'Novo Insumo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Input
                value={form.produto || ''}
                onChange={(e) => setForm({ ...form, produto: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade Atual</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.quantidade_atual ?? ''}
                  onChange={(e) => setForm({ ...form, quantidade_atual: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input
                  value={form.unidade_medida || ''}
                  onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custo Médio (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.custo_medio_unitario ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, custo_medio_unitario: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo Crítico</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.estoque_minimo_critico ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, estoque_minimo_critico: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Consumo Médio Diário</Label>
              <Input
                type="number"
                step="any"
                value={form.consumo_medio_diario ?? ''}
                onChange={(e) => setForm({ ...form, consumo_medio_diario: Number(e.target.value) })}
              />
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
              Esta ação não pode ser desfeita. O insumo será removido permanentemente.
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
