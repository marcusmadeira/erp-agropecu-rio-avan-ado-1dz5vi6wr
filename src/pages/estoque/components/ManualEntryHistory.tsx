import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { getEstoqueMovimentacoes, EstoqueMovimentacao } from '@/services/estoque_movimentacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_INSUMOS } from './ManualEntryForm'

export function ManualEntryHistory() {
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacao[]>([])
  const [categoria, setCategoria] = useState<string>('all')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')

  const loadData = useCallback(async () => {
    let filter = `tipo = 'ENTRADA_MANUAL'`
    if (categoria !== 'all') filter += ` && produto_id.categoria = '${categoria}'`
    if (dataInicio) filter += ` && data >= '${dataInicio} 00:00:00'`
    if (dataFim) filter += ` && data <= '${dataFim} 23:59:59'`

    try {
      const data = await getEstoqueMovimentacoes(filter)
      setMovimentacoes(data)
    } catch (err) {
      console.error(err)
    }
  }, [categoria, dataInicio, dataFim])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('estoque_movimentacoes', loadData)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <CardTitle>Histórico de Entradas</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Categoria:</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIAS_INSUMOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Data:</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-[130px]"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-[130px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto border rounded-md">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/30">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Data
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Produto
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  Quantidade
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  V. Unitário
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {movimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Nenhuma entrada encontrada para os filtros.
                  </td>
                </tr>
              ) : (
                movimentacoes.map((m) => (
                  <tr key={m.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle whitespace-nowrap">
                      {format(new Date(m.data), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {m.expand?.produto_id?.produto}
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/5 text-primary">
                        {m.expand?.produto_id?.categoria || '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {m.quantidade}{' '}
                      <span className="text-xs text-muted-foreground">
                        {m.expand?.produto_id?.unidade_medida}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {formatCurrency(m.valor_unitario || 0)}
                    </td>
                    <td className="p-4 align-middle text-right font-bold">
                      {formatCurrency(m.valor_total || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
