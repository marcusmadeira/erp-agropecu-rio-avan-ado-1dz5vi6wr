import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { getEstoqueMovimentacoes } from '@/services/estoque_movimentacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { format, parseISO } from 'date-fns'

export function HistoricoEstoque() {
  const [movs, setMovs] = useState<any[]>([])
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroCat, setFiltroCat] = useState('TODAS')

  const loadData = async () => {
    const data = await getEstoqueMovimentacoes()
    setMovs(data)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('estoque_movimentacoes', loadData)

  const filtered = movs.filter((m) => {
    if (filtroTipo !== 'TODOS' && m.tipo !== filtroTipo) return false
    const cat = m.expand?.produto_id?.categoria || 'Outros'
    if (filtroCat !== 'TODAS' && cat !== filtroCat && !m.racao_id) return false
    if (filtroCat !== 'TODAS' && m.racao_id) return false
    return true
  })

  const categoriasRaw = Array.from(
    new Set(movs.map((m) => m.expand?.produto_id?.categoria).filter(Boolean)),
  )

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>Tipo de Movimentação</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ENTRADA_NOTA_FISCAL">Entrada via NF</SelectItem>
                <SelectItem value="ENTRADA_MANUAL">Entrada Manual</SelectItem>
                <SelectItem value="SAIDA_RACAO">Saída (Ração)</SelectItem>
                <SelectItem value="PRODUCAO_RACAO">Produção (Ração)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>Categoria (Insumos)</Label>
            <Select value={filtroCat} onValueChange={setFiltroCat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {categoriasRaw.map((c) => (
                  <SelectItem key={c as string} value={c as string}>
                    {c as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto/Formulação</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Val. Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Fornecedor/Obs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.data ? format(parseISO(m.data), 'dd/MM/yyyy') : ''}</TableCell>
                  <TableCell className="font-medium text-slate-600">
                    {m.tipo.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {m.expand?.produto_id?.produto ||
                      m.expand?.racao_id?.nome_formulacao ||
                      'Item Deletado'}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.quantidade?.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    R${' '}
                    {(m.valor_unitario || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    R${' '}
                    {(m.valor_total || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={m.fornecedor}>
                    {m.fornecedor || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    Nenhuma movimentação encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
