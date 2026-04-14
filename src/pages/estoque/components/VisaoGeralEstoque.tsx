import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEstoqueInsumos } from '@/services/estoque_insumos'
import { getEstoqueMovimentacoes } from '@/services/estoque_movimentacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { format, parseISO } from 'date-fns'

export function VisaoGeralEstoque() {
  const [insumos, setInsumos] = useState<any[]>([])
  const [movs, setMovs] = useState<any[]>([])

  const loadData = async () => {
    const [ins, ms] = await Promise.all([getEstoqueInsumos(), getEstoqueMovimentacoes()])
    setInsumos(ins)
    setMovs(ms)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('estoque_insumos', loadData)
  useRealtime('estoque_movimentacoes', loadData)

  const insumosComCMP = useMemo(() => {
    return insumos.map((ins) => {
      const entradas = movs.filter(
        (m) =>
          m.produto_id === ins.id && ['ENTRADA_NOTA_FISCAL', 'ENTRADA_MANUAL'].includes(m.tipo),
      )
      const sumQtd = entradas.reduce((acc, m) => acc + (m.quantidade || 0), 0)
      const sumValor = entradas.reduce(
        (acc, m) => acc + (m.quantidade || 0) * (m.valor_unitario || 0),
        0,
      )
      const cmp = sumQtd > 0 ? sumValor / sumQtd : ins.custo_medio_unitario || 0
      const valorTotal = ins.quantidade_atual * cmp
      return { ...ins, cmp, valorTotal }
    })
  }, [insumos, movs])

  const categorias = useMemo(() => {
    const cats: Record<string, { qtd: number; valor: number }> = {}
    insumosComCMP.forEach((ins) => {
      const cat = ins.categoria || 'Outros'
      if (!cats[cat]) cats[cat] = { qtd: 0, valor: 0 }
      cats[cat].qtd += ins.quantidade_atual
      cats[cat].valor += ins.valorTotal
    })
    return Object.entries(cats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor)
  }, [insumosComCMP])

  const chartData = useMemo(() => {
    const map: Record<string, { key: string; name: string; Entradas: number; Saidas: number }> = {}
    movs.forEach((m) => {
      if (!m.data) return
      const monthKey = m.data.substring(0, 7) // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = {
          key: monthKey,
          name: format(parseISO(m.data), 'MMM/yy'),
          Entradas: 0,
          Saidas: 0,
        }
      }
      if (m.tipo.includes('ENTRADA')) {
        map[monthKey].Entradas += m.quantidade || 0
      } else if (m.tipo.includes('SAIDA')) {
        map[monthKey].Saidas += m.quantidade || 0
      }
    })
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...rest }) => rest)
  }, [movs])

  const totalEstoque = categorias.reduce((acc, c) => acc + c.valor, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Valor Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              R${' '}
              {totalEstoque.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total de Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{categorias.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estoque por Categoria (Valor x Qtd)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {categorias.map((c) => (
                <div key={c.name} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-sm text-slate-500">
                      {c.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} un/kg
                    </div>
                  </div>
                  <div className="font-bold text-[#094016]">
                    R${' '}
                    {c.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
              {categorias.length === 0 && (
                <div className="text-center py-4 text-slate-500">Nenhum estoque disponível.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações (Entradas vs Saídas) em Kg/Un</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                Entradas: { label: 'Entradas', color: 'hsl(var(--primary))' },
                Saidas: { label: 'Saídas', color: 'hsl(var(--destructive))' },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Entradas" fill="var(--color-Entradas)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saidas" fill="var(--color-Saidas)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
