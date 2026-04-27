import { useState, useEffect, useMemo } from 'react'
import { getLotes, deleteLote } from '@/services/lotes'
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
import { Plus, Pencil, Trash2, Search, PackagePlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import LoteForm from './LoteForm'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function LotesTab() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { toast } = useToast()
  const { user } = useAuth()
  const canEdit =
    user?.nivel_acesso === 'Gerente' ||
    user?.nivel_acesso === 'Operacional' ||
    user?.nivel_acesso === 'Financeiro' ||
    user?.role === 'Admin'

  const loadData = async () => {
    try {
      const items = await getLotes()
      setData(items)
    } catch (e) {
      toast({ title: 'Erro ao carregar lotes', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lotes', () => {
    loadData()
  })

  const filtered = useMemo(() => {
    return data.filter((item) => item.nome_lote?.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lote?')) return
    try {
      await deleteLote(id)
      toast({ title: 'Lote excluído' })
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
    { header: 'Nome do Lote', dataKey: 'nome_lote' },
    { header: 'Centro de Custo', dataKey: 'centro_custo' },
    { header: 'Piquete Atual', dataKey: 'piquete_atual' },
    { header: 'Nutrição Padrão', dataKey: 'nutricao_padrao' },
    { header: 'Qtd. Cabeças', dataKey: 'quantidade_cabecas' },
  ]

  const mappedExportData = filtered.map((f) => ({
    ...f,
    piquete_atual: f.expand?.piquete_atual_id?.nome || '-',
    nutricao_padrao: f.expand?.formulacao_id?.nome_formulacao || '-',
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <PackagePlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Lotes</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os lotes, nutrição e piquetes do seu rebanho.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Gestão de Lotes',
                data: mappedExportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Lotes',
                data: mappedExportData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
          {canEdit && (
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Lote
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nome do Lote</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Piquete Atual</TableHead>
              <TableHead>Nutrição Padrão</TableHead>
              <TableHead className="text-center">Qtd. Cabeças</TableHead>
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
                  Nenhum lote cadastrado ou encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-800">{item.nome_lote}</TableCell>
                  <TableCell>{item.centro_custo || '-'}</TableCell>
                  <TableCell className="text-slate-600">
                    {item.expand?.piquete_atual_id?.nome || '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.expand?.formulacao_id?.nome_formulacao || '-'}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">
                    {item.quantidade_cabecas ?? '0'}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4 text-slate-600 hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
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

      {formOpen && <LoteForm open={formOpen} onOpenChange={setFormOpen} item={editingItem} />}
    </div>
  )
}
