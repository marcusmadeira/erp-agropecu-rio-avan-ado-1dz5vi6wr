import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { AlertCircle, Box } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EstoqueTab({ estoque }: { estoque: any[] }) {
  const totalInsumos = estoque.length
  const produtosEmFalta = useMemo(
    () => estoque.filter((e) => (e.quantidade_atual || 0) < (e.estoque_minimo_critico || 0)),
    [estoque],
  )

  const chartDataEstoque = useMemo(
    () => estoque.map((e) => ({ name: e.produto, value: e.quantidade_atual || 0 })),
    [estoque],
  )
  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#0f172a]">Total de Insumos</CardTitle>
            <Box className="h-4 w-4 text-[#0f172a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0f172a]">{totalInsumos}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#0f172a]">Produtos em Falta</CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${produtosEmFalta.length > 0 ? 'text-red-500' : 'text-[#0f172a]'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${produtosEmFalta.length > 0 ? 'text-red-600' : 'text-[#0f172a]'}`}
            >
              {produtosEmFalta.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#0f172a]">Distribuição de Insumos</CardTitle>
            <CardDescription>Quantidade em estoque por produto</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartDataEstoque.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataEstoque}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartDataEstoque.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 flex flex-col">
          <CardHeader>
            <CardTitle className="text-[#0f172a]">Produtos Críticos</CardTitle>
            <CardDescription>Abaixo do estoque mínimo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#0f172a]">Produto</TableHead>
                  <TableHead className="text-[#0f172a] text-right">Qtd Atual</TableHead>
                  <TableHead className="text-[#0f172a] text-right">Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosEmFalta.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.produto}
                      <Badge
                        variant="outline"
                        className="ml-2 bg-red-50 text-red-600 border-red-200"
                      >
                        Crítico
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-bold">
                      {p.quantidade_atual} {p.unidade_medida}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {p.estoque_minimo_critico} {p.unidade_medida}
                    </TableCell>
                  </TableRow>
                ))}
                {produtosEmFalta.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Tudo OK
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
