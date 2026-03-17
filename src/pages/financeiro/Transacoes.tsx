import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
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
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/components/dashboard/KpiCards'

export default function Transacoes() {
  const { state } = useAppStore()
  const [filterCC, setFilterCC] = useState('ALL')

  const filtered = state.transacoes
    .filter((t) => (filterCC === 'ALL' ? true : t.costCenter === filterCC))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-emerald-900">Transações e Fluxo</h2>
        <Select value={filterCC} onValueChange={setFilterCC}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filtrar C.C." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Centros</SelectItem>
            <SelectItem value="CC01-PO">CC01-PO</SelectItem>
            <SelectItem value="CC02-TIP">CC02-TIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">
                    {format(parseISO(t.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold text-xs uppercase px-2 py-1 rounded ${t.type === 'Receita' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}
                    >
                      {t.type}
                    </span>
                  </TableCell>
                  <TableCell>{t.costCenter}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Pago' ? 'default' : 'outline'}>{t.status}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-bold ${t.type === 'Receita' ? 'text-emerald-700' : 'text-rose-700'}`}
                  >
                    {t.type === 'Receita' ? '+' : '-'}
                    {formatCurrency(t.value)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhuma transação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
