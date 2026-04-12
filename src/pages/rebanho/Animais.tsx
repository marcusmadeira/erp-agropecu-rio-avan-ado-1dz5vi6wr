import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAnimais, deleteAnimal } from '@/services/animais'
import { getLotes } from '@/services/lotes'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import AnimalForm from '@/pages/cadastros/AnimalForm'

export default function Animais() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [animais, setAnimais] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [search, setSearch] = useState('')
  const [fCat, setFCat] = useState('all')
  const [fSexo, setFSexo] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [fLote, setFLote] = useState('all')

  const canDelete =
    user?.nivel_acesso === 'Gerente' || user?.nivel_acesso === 1 || user?.nivel_acesso === '1'

  const loadData = async () => {
    try {
      const [aData, lData] = await Promise.all([getAnimais({ sort: '-created' }), getLotes()])
      setAnimais(aData)
      setLotes(lData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('animais', loadData)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este animal?')) return
    try {
      await deleteAnimal(id)
      toast({ title: 'Sucesso', description: 'Animal excluído.' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' })
    }
  }

  const filtered = useMemo(() => {
    return animais.filter((a) => {
      const matchCat = fCat === 'all' || a.categoria === fCat
      const matchSexo = fSexo === 'all' || a.sexo === fSexo
      const matchStatus = fStatus === 'all' || a.status === fStatus
      const matchLote = fLote === 'all' || a.lote_atual === fLote
      const searchLower = search.toLowerCase()
      const matchSearch =
        !search ||
        a.nome?.toLowerCase().includes(searchLower) ||
        a.id_manejo_brinco?.toLowerCase().includes(searchLower)
      return matchCat && matchSexo && matchStatus && matchLote && matchSearch
    })
  }, [animais, fCat, fSexo, fStatus, fLote, search])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#094016]">Gestão de Animais</h2>
          <p className="text-muted-foreground">
            Controle individual do rebanho, filtros avançados e busca.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setFormOpen(true)
          }}
          className="bg-[#094016] text-white hover:bg-[#094016]/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Animal
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Buscar (Nome/Brinco)
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categoria
            </label>
            <Select value={fCat} onValueChange={setFCat}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Matriz PO">Matriz PO</SelectItem>
                <SelectItem value="Touro PO">Touro PO</SelectItem>
                <SelectItem value="Bezerro">Bezerro</SelectItem>
                <SelectItem value="Novilha TIP">Novilha TIP</SelectItem>
                <SelectItem value="Garrote TIP">Garrote TIP</SelectItem>
                <SelectItem value="Vaca Descarte TIP">Vaca Descarte TIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sexo
            </label>
            <Select value={fSexo} onValueChange={setFSexo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status
            </label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Vendido">Vendido</SelectItem>
                <SelectItem value="Morto">Morto</SelectItem>
                <SelectItem value="Descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lote
            </label>
            <Select value={fLote} onValueChange={setFLote}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              Nenhum animal encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Brinco</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Lote Atual</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-bold text-slate-900">
                        {a.id_manejo_brinco || '-'}
                      </TableCell>
                      <TableCell>{a.nome || '-'}</TableCell>
                      <TableCell>{a.categoria}</TableCell>
                      <TableCell>{a.sexo || '-'}</TableCell>
                      <TableCell>{a.expand?.lote_atual?.nome_lote || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-[#094016]">
                        {a.peso_atual_kg}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}
                        >
                          {a.status || 'Ativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="Ver Ficha">
                            <Link to={`/animais/${a.id}`}>
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingItem(a)
                              setFormOpen(true)
                            }}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-amber-600" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(a.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSaved={loadData}
      />
    </div>
  )
}
