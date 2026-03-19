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
import { format, parseISO, isValid } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/components/dashboard/KpiCards'
import { Check, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TransactionForm } from './TransactionForm'
import { CENTROS_CUSTO } from './constants'
import { useInttegraSync } from '@/hooks/useInttegraSync'

export default function Transacoes() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [filterCC, setFilterCC] = useState('ALL')

  const filtered = state.transacoes
    .filter((t) => (filterCC === 'ALL' ? true : t.Centro_Custo_Direcionado === filterCC))
    .sort((a, b) => {
      const dateA = a.Data_Competencia ? new Date(a.Data_Competencia).getTime() : 0
      const dateB = b.Data_Competencia ? new Date(b.Data_Competencia).getTime() : 0
      return dateB - dateA
    })

  const handlePay = (id: string, desc: string) => {
    const dataEfetivacao = new Date().toISOString()
    dispatch((s) => ({
      ...s,
      transacoes: s.transacoes.map((t) =>
        t.id === id
          ? { ...t, Status_Pagamento: 'Efetivado', Data_Efetivacao_Real: dataEfetivacao }
          : t,
      ),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Transacoes',
          recordId: desc,
          oldValue: 'Pendente/Atrasado',
          newValue: 'Efetivado',
        },
        ...s.auditLogs,
      ],
    }))

    const tx = state.transacoes.find((t) => t.id === id)
    if (tx) {
      pushRecord('Financeiro_Transacoes', id, { ...tx, Status_Pagamento: 'Efetivado' })
    }

    toast({
      title: 'Transação Efetivada',
      description: 'Lançamento DRE atualizado e Inttegra notificado.',
    })
  }

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '-'
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Transações DRE</h2>
          <p className="text-sm text-muted-foreground">Gestão financeira hierárquica Inttegra</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCC} onValueChange={setFilterCC}>
            <SelectTrigger className="w-56 bg-white">
              <SelectValue placeholder="Filtrar C.C." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Centros de Custo</SelectItem>
              {CENTROS_CUSTO.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TransactionForm />
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Descrição / Parceiro</TableHead>
                <TableHead>DRE (Conta/Cat)</TableHead>
                <TableHead>C.Custo</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const partner = t.Parceiro_Vinculado
                  ? state.parceiros.find((p) => p.id === t.Parceiro_Vinculado)
                  : null

                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">
                      {safeFormatDate(t.Data_Competencia)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.Descricao_Lancamento}
                      {partner && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-normal">
                          <User className="w-3 h-3" /> {partner.Nome_Razao_Social}
                        </div>
                      )}
                      <div className="text-[10px] uppercase mt-1">
                        <span
                          className={
                            t.Tipo_Movimento === 'Receita'
                              ? 'text-emerald-600 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {t.Tipo_Movimento}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-700">
                        {t.Macroconta_Inttegra}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.Categoria_Inttegra}{' '}
                        {t.Subcategoria_Detalhe ? ` > ${t.Subcategoria_Detalhe}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{t.Centro_Custo_Direcionado}</TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${t.Tipo_Movimento === 'Receita' ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {t.Tipo_Movimento === 'Receita' ? '+' : '-'}
                      {formatCurrency(t.Valor_Total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.Status_Pagamento === 'Efetivado'
                            ? 'default'
                            : t.Status_Pagamento === 'Atrasado'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {t.Status_Pagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.Status_Pagamento !== 'Efetivado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handlePay(t.id, t.Descricao_Lancamento)}
                        >
                          <Check className="w-3 h-3 mr-1" /> Efetivar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
