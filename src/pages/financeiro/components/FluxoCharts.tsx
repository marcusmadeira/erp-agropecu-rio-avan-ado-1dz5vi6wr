import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'

const config = {
  realized: { label: 'Realizada', color: 'hsl(var(--chart-1))' },
  expected: { label: 'Esperada', color: 'hsl(var(--chart-2))' },
  value: { label: 'Valor', color: 'hsl(var(--chart-3))' },
}
const PIE_COLORS = ['hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export function FluxoCharts({ data }: { data: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Evolução de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[300px] w-full">
            <LineChart data={data.line}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(val) => `R$${val / 1000}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="realized"
                stroke="var(--color-realized)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="var(--color-expected)"
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Tabs defaultValue="bar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bar">Comercial vs PO</TabsTrigger>
              <TabsTrigger value="pie">Pagamento</TabsTrigger>
            </TabsList>
            <TabsContent value="bar" className="mt-4">
              <ChartContainer config={config} className="h-[250px] w-full">
                <BarChart data={data.bar}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `R$${val / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="pie" className="mt-4">
              <ChartContainer config={config} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={data.pie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {data.pie.map((_: any, i: number) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}
