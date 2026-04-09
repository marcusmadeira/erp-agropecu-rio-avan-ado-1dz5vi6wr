import { useState, useEffect, useMemo } from 'react'
import { getAnimais, deleteAnimal } from '@/services/animais'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import AnimalForm from './AnimalForm'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function AnimaisTab() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { toast } = useToast()
  const { user } = useAuth()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 3

  const loadData = async () => {
    try {
      const items = await getAnimais()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar animais', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('animais', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.id_manejo_brinco?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [data, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este animal?')) return
    try {
      await deleteAnimal(id)
      toast({ title: 'Animal excluído' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const openNew = () => {
    setEditingItem(null)
    setFormOpen(true)
  }
  const openEdit = (item: any) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const exportColumns = [
    { header: 'Brinco', dataKey: 'id_manejo_brinco' },
    { header: 'Categoria', dataKey: 'categoria' },
    { header: 'Lote Atual', dataKey: (r: any) => r.expand?.lote_atual?.nome_lote || '-' },
    { header: 'Peso (kg)', dataKey: 'peso_atual_kg' },
    { header: 'Status', dataKey: 'status' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pelo brinco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Animais',
                data: filtered,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Animais',
                data: filtered,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
          {canEdit && (
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Novo Registro
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brinco</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Lote Atual</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 6 : 5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">
                    {item.id_manejo_brinco}
                  </TableCell>
                  <TableCell>{item.categoria || '-'}</TableCell>
                  <TableCell>{item.expand?.lote_atual?.nome_lote || '-'}</TableCell>
                  <TableCell>{item.peso_atual_kg ?? '-'}</TableCell>
                  <TableCell>{item.status || '-'}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {formOpen && <AnimalForm open={formOpen} onOpenChange={setFormOpen} item={editingItem} />}
    </div>
  )
}
