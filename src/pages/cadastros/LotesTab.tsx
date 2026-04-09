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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import LoteForm from './LoteForm'
import { useAuth } from '@/hooks/use-auth'

export default function LotesTab() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { toast } = useToast()
  const { user } = useAuth()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 3

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Novo Registro
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Lote</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Qtd. Cabeças</TableHead>
              <TableHead>Peso Médio (kg)</TableHead>
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
                  <TableCell className="font-medium text-slate-800">{item.nome_lote}</TableCell>
                  <TableCell>{item.centro_custo || '-'}</TableCell>
                  <TableCell>{item.quantidade_cabecas ?? '-'}</TableCell>
                  <TableCell>{item.peso_medio_lote ?? '-'}</TableCell>
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

      {formOpen && <LoteForm open={formOpen} onOpenChange={setFormOpen} item={editingItem} />}
    </div>
  )
}
