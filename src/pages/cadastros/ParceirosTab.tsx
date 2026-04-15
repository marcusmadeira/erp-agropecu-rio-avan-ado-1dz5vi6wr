import { useState, useEffect, useMemo } from 'react'
import { getParceiros, deleteParceiro } from '@/services/parceiros_negocios'
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
import ParceiroForm from './ParceiroForm'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function ParceirosTab() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { toast } = useToast()
  const { user } = useAuth()
  const canEdit =
    user?.nivel_acesso === 'Gerente' ||
    user?.nivel_acesso === 'Operacional' ||
    user?.role === 'Admin'

  const loadData = async () => {
    try {
      const items = await getParceiros()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar parceiros', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('parceiros_negocios', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.nome_razao_social?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [data, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este parceiro?')) return
    try {
      await deleteParceiro(id)
      toast({ title: 'Parceiro excluído' })
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
    { header: 'Nome/Razão Social', dataKey: 'nome_razao_social' },
    {
      header: 'Documento',
      dataKey: (r: any) =>
        r.tipo_documento ? `${r.tipo_documento}: ${r.numero_documento}` : r.numero_documento || '-',
    },
    { header: 'Categoria', dataKey: 'categoria_parceiro' },
    { header: 'Status', dataKey: 'status' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parceiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Parceiros de Negócios',
                data: filtered,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Parceiros de Negócios',
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
              <TableHead>Nome/Razão Social</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 5 : 4}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-800">
                    {item.nome_razao_social}
                  </TableCell>
                  <TableCell>
                    {item.tipo_documento
                      ? `${item.tipo_documento}: ${item.numero_documento}`
                      : item.numero_documento || '-'}
                  </TableCell>
                  <TableCell>{item.categoria_parceiro || '-'}</TableCell>
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

      {formOpen && <ParceiroForm open={formOpen} onOpenChange={setFormOpen} item={editingItem} />}
    </div>
  )
}
