import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { MACRO_CONTAS, CATEGORIAS, SUBCATEGORIAS, CENTROS_CUSTO } from './constants'
import useAppStore from '@/stores/useAppStore'
import { Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'

export function TransactionForm() {
  const { state, dispatch } = useAppStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    Descricao_Lancamento: '',
    Valor_Total: '',
    Tipo_Movimento: 'Despesa',
    Data_Competencia: new Date().toISOString().split('T')[0],
    Data_Vencimento: new Date().toISOString().split('T')[0],
    Centro_Custo_Direcionado: 'CC01-Nelore PO',
    Status_Pagamento: 'Pendente',
    Macroconta_Inttegra: '',
    Categoria_Inttegra: '',
    Subcategoria_Detalhe: '',
    Parceiro_Vinculado: 'none',
  })

  const cats = CATEGORIAS[form.Macroconta_Inttegra] || []
  const subCats = SUBCATEGORIAS[form.Categoria_Inttegra] || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch((s) => ({
      ...s,
      transacoes: [
        {
          ...form,
          id: Math.random().toString(),
          Valor_Total: Number(form.Valor_Total),
          Data_Competencia: new Date(form.Data_Competencia).toISOString(),
          Data_Vencimento: new Date(form.Data_Vencimento).toISOString(),
          Data_Efetivacao_Real:
            form.Status_Pagamento === 'Efetivado' ? new Date().toISOString() : undefined,
          Parceiro_Vinculado:
            form.Parceiro_Vinculado === 'none' ? undefined : form.Parceiro_Vinculado,
        } as any,
        ...s.transacoes,
      ],
    }))
    setOpen(false)
  }

  // Filter Business Partners based on transaction type (Acceptance Criteria 2)
  const parceirosDisponiveis = state.parceiros.filter((p) => {
    if (p.Status !== 'Ativo') return false
    if (form.Tipo_Movimento === 'Despesa') {
      return (
        p.Categoria_Parceiro.includes('Fornecedor') || p.Categoria_Parceiro.includes('Funcionário')
      )
    } else {
      return p.Categoria_Parceiro.includes('Cliente')
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação DRE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lançamento Financeiro DRE</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.Tipo_Movimento}
                onValueChange={(v) =>
                  setForm({ ...form, Tipo_Movimento: v, Parceiro_Vinculado: 'none' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={form.Valor_Total}
                onChange={(e) => setForm({ ...form, Valor_Total: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              required
              value={form.Descricao_Lancamento}
              onChange={(e) => setForm({ ...form, Descricao_Lancamento: e.target.value })}
            />
          </div>

          <div>
            <Label>Parceiro de Negócio (Opcional)</Label>
            <Select
              value={form.Parceiro_Vinculado}
              onValueChange={(v) => setForm({ ...form, Parceiro_Vinculado: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um parceiro..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum / Não Aplicável</SelectItem>
                {parceirosDisponiveis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.Nome_Razao_Social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {form.Tipo_Movimento === 'Despesa'
                ? 'Sugestões: Fornecedores e Funcionários'
                : 'Sugestões: Clientes'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Competência</Label>
              <Input
                required
                type="date"
                value={form.Data_Competencia}
                onChange={(e) => setForm({ ...form, Data_Competencia: e.target.value })}
              />
            </div>
            <div>
              <Label>Centro Custo</Label>
              <Select
                value={form.Centro_Custo_Direcionado}
                onValueChange={(v) => setForm({ ...form, Centro_Custo_Direcionado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CENTROS_CUSTO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Macroconta (Inttegra)</Label>
            <Select
              value={form.Macroconta_Inttegra}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  Macroconta_Inttegra: v,
                  Categoria_Inttegra: '',
                  Subcategoria_Detalhe: '',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a macroconta..." />
              </SelectTrigger>
              <SelectContent>
                {MACRO_CONTAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {cats.length > 0 && (
            <div>
              <Label>Categoria Inttegra</Label>
              <Select
                value={form.Categoria_Inttegra}
                onValueChange={(v) =>
                  setForm({ ...form, Categoria_Inttegra: v, Subcategoria_Detalhe: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {subCats.length > 0 && (
            <div>
              <Label>Subcategoria (Opcional)</Label>
              <Select
                value={form.Subcategoria_Detalhe || 'none'}
                onValueChange={(v) =>
                  setForm({ ...form, Subcategoria_Detalhe: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {subCats.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800">
            Salvar Lançamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
