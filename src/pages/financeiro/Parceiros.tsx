import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Edit2 } from 'lucide-react'
import { ParceiroNegocio } from '@/stores/types'

const CATEGORIAS_DISPONIVEIS = [
  'Fornecedor',
  'Cliente',
  'Funcionário',
  'Transportadora',
  'Proprietário',
]

export default function Parceiros() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [filterCat, setFilterCat] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState<Partial<ParceiroNegocio>>({
    Nome_Razao_Social: '',
    Tipo_Documento: 'CNPJ',
    Numero_Documento: '',
    Categoria_Parceiro: [],
    Status: 'Ativo',
    ID_Inttegra: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = state.parceiros.filter((p) => {
    if (filterStatus !== 'ALL' && p.Status !== filterStatus) return false
    if (filterCat !== 'ALL' && !p.Categoria_Parceiro.includes(filterCat)) return false
    return true
  })

  const openNew = () => {
    setEditingId(null)
    setForm({
      Nome_Razao_Social: '',
      Tipo_Documento: 'CNPJ',
      Numero_Documento: '',
      Categoria_Parceiro: [],
      Status: 'Ativo',
      ID_Inttegra: '',
    })
    setOpen(true)
  }

  const openEdit = (p: ParceiroNegocio) => {
    setEditingId(p.id)
    setForm(p)
    setOpen(true)
  }

  const toggleCat = (cat: string) => {
    setForm((prev) => {
      const cats = prev.Categoria_Parceiro || []
      return {
        ...prev,
        Categoria_Parceiro: cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat],
      }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.Nome_Razao_Social ||
      !form.Numero_Documento ||
      (form.Categoria_Parceiro && form.Categoria_Parceiro.length === 0)
    ) {
      toast({
        title: 'Aviso',
        description: 'Preencha os campos obrigatórios (Nome, Doc e Categoria).',
        variant: 'destructive',
      })
      return
    }

    dispatch((s) => {
      if (editingId) {
        return {
          ...s,
          parceiros: s.parceiros.map((p) =>
            p.id === editingId ? ({ ...p, ...form } as ParceiroNegocio) : p,
          ),
        }
      } else {
        return {
          ...s,
          parceiros: [{ ...form, id: Math.random().toString() } as ParceiroNegocio, ...s.parceiros],
        }
      }
    })
    setOpen(false)
    toast({ title: 'Parceiro de Negócio Salvo' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-900" />
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Parceiros de Negócios</h2>
            <p className="text-sm text-muted-foreground">
              Fornecedores, Clientes, Funcionários e Terceiros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas Categorias</SelectItem>
              {CATEGORIAS_DISPONIVEIS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNew} className="bg-emerald-800">
            <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
          </Button>
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Razão Social</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>ID Inttegra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.Nome_Razao_Social}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {p.Tipo_Documento}: {p.Numero_Documento}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {p.Categoria_Parceiro.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] bg-slate-50">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.ID_Inttegra || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.Status === 'Ativo' ? 'default' : 'secondary'}
                      className={p.Status === 'Ativo' ? 'bg-emerald-600' : ''}
                    >
                      {p.Status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(p)}
                      className="text-emerald-700"
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Nenhum parceiro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro de Negócios'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label>Nome ou Razão Social</Label>
              <Input
                required
                value={form.Nome_Razao_Social}
                onChange={(e) => setForm({ ...form, Nome_Razao_Social: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo de Documento</Label>
                <Select
                  value={form.Tipo_Documento}
                  onValueChange={(v: any) => setForm({ ...form, Tipo_Documento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Número do Doc. (Chave)</Label>
                <Input
                  required
                  value={form.Numero_Documento}
                  onChange={(e) => setForm({ ...form, Numero_Documento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Classificação (Múltipla Escolha)</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-slate-50">
                {CATEGORIAS_DISPONIVEIS.map((cat) => (
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.Categoria_Parceiro?.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <span className="text-sm font-medium">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status Cadastral</Label>
                <Select
                  value={form.Status}
                  onValueChange={(v: any) => setForm({ ...form, Status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>ID Integração (Opcional)</Label>
                <Input
                  value={form.ID_Inttegra}
                  onChange={(e) => setForm({ ...form, ID_Inttegra: e.target.value })}
                  placeholder="INT-001"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 mt-4">
              Salvar Registro
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
