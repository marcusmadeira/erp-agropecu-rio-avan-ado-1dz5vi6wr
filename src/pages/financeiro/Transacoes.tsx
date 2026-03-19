import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { useInttegraSync } from '@/hooks/useInttegraSync'
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
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/components/dashboard/KpiCards'
import { Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Transacoes() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [filterCC, setFilterCC] = useState('ALL')

  const filtered = state.transacoes
    .filter((t) => (filterCC === 'ALL' ? true : t.costCenter === filterCC))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handlePay = (id: string, desc: string) => {
    dispatch((s) => ({
      ...s,
      transacoes: s.transacoes.map((t) => (t.id === id ? { ...t, status: 'Pago' } : t)),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Transacoes',
          recordId: desc,
          oldValue: 'Pendente',
          newValue: 'Pago',
        },
        ...s.auditLogs,
      ],
    }))

    const tx = state.transacoes.find((t) => t.id === id)
    if (tx) {
      pushRecord('Financeiro_Transacoes', id, { ...tx, status: 'Pago' })
    }

    toast({
      title: 'Transação baixada',
      description: 'Log de auditoria gerado e Inttegra notificado.',
    })
  }

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
                <TableHead>Venc./Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>C.Custo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">
                    {format(parseISO(t.due_date || t.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold text-[10px] uppercase px-2 py-1 rounded ${t.type === 'Receita' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}
                    >
                      {t.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{t.costCenter}</TableCell>
                  <TableCell
                    className={`text-right font-mono font-bold ${t.type === 'Receita' ? 'text-emerald-700' : 'text-rose-700'}`}
                  >
                    {t.type === 'Receita' ? '+' : '-'}
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Pago' ? 'default' : 'outline'}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {t.status === 'Pendente' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handlePay(t.id, t.description)}
                      >
                        <Check className="w-3 h-3 mr-1" /> Baixar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
