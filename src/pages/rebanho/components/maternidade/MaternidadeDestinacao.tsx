import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getReclassificacoes } from '@/services/maternidade'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'
import { DialogDestinacao } from './FormDestinacao'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  touro: { label: 'Touro PO', color: '#094016' },
  descarte: { label: 'Descarte', color: '#ef4444' },
  comercial: { label: 'Comercial', color: '#f59e0b' },
}

export function MaternidadeDestinacao() {
  const [data, setData] = useState<any[]>([])
  const [openForm, setOpenForm] = useState(false)

  const loadData = async () => setData(await getReclassificacoes())

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('reclassificacao_descarte', loadData)
  useRealtime('animais', loadData)

  const destCategories = ['Touro PO', 'Descarte', 'Garrote TIP', 'Comercial']
  const filteredData = data.filter((d) => destCategories.includes(d.nova_categoria))

  const chartData = [
    {
      name: 'Touro PO',
      key: 'touro',
      value: filteredData.filter((d) => d.nova_categoria === 'Touro PO').length,
    },
    {
      name: 'Descarte',
      key: 'descarte',
      value: filteredData.filter((d) => d.nova_categoria === 'Descarte').length,
    },
    {
      name: 'Comercial',
      key: 'comercial',
      value: filteredData.filter(
        (d) => d.nova_categoria === 'Garrote TIP' || d.nova_categoria === 'Comercial',
      ).length,
    },
  ].filter((d) => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up delay-75">
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#094016]">Histórico de Destinações</h2>
          <Button
            onClick={() => setOpenForm(true)}
            className="bg-[#094016] hover:bg-[#094016]/90 text-white font-bold"
          >
            <MapPin className="w-4 h-4 mr-2" /> Destinar Bezerro
          </Button>
        </div>
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bezerro</TableHead>
                <TableHead>RGN</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">
                    {item.expand?.animal_id?.id_manejo_brinco || 'N/A'}
                  </TableCell>
                  <TableCell>{item.expand?.animal_id?.rgd_rgn_abcz || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {item.nova_categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{item.motivo}</TableCell>
                  <TableCell>
                    {item.data ? format(new Date(item.data.replace(' ', 'T')), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma destinação registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col">
        <h2 className="text-xl font-bold text-[#094016] mb-4">Análise de Destinação</h2>
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-[300px]">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartConfig[entry.key as keyof typeof chartConfig]?.color || '#000'}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Dados insuficientes para o gráfico.</p>
          )}
        </div>
      </div>

      <DialogDestinacao
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={() => {
          setOpenForm(false)
          loadData()
        }}
      />
    </div>
  )
}
