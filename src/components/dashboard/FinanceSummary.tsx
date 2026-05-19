import { useMemo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, MessageSquare } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { Transacao } from '@/stores/types'
import { formatCurrency as _formatCurrency } from '@/lib/utils'

const formatCurrency = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
  return _formatCurrency(val)
}
import { format, differenceInDays } from 'date-fns'
import { getConsolidatedFinancials } from '@/services/financeService'

export default function FinanceSummary({ transactions }: { transactions: Transacao[] }) {
  const { state } = useAppStore()

  const [dashboardStats, setDashboardStats] = useState<any>({
    realizedRevenue: 0,
    realizedExpenses: 0,
    balance: 0,
    pendingRevenue: 0,
    delinquency: 0,
    expected30d: 0,
    pieData: [],
    overdueList: [],
  })

  useEffect(() => {
    getConsolidatedFinancials().then(setDashboardStats).catch(console.error)
  }, [transactions]) // refresh when transactions update

  const {
    realizedRevenue: receitas,
    realizedExpenses: despesas,
    balance: saldo,
    delinquency: overdueAmount,
    expected30d,
    pieData,
    overdueList,
  } = dashboardStats

  const openWhatsApp = (phone?: string, text?: string) => {
    if (!phone) return
    window.open(
      `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text || '')}`,
      '_blank',
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-subtle border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-secondary">Receitas Efetuadas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-mono">
              {formatCurrency(receitas)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-secondary">Despesas Efetuadas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive font-mono">
              {formatCurrency(despesas)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-subtle border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-secondary">Saldo no Período</CardTitle>
            <Wallet className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${saldo >= 0 ? 'text-secondary' : 'text-destructive'}`}
            >
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1 lg:col-span-1 space-y-4">
          <Card className="shadow-subtle border-t-4 border-t-rose-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-secondary">Inadimplência (Atrasados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 font-mono">
                {formatCurrency(overdueAmount)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-subtle border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-secondary">Previsão Recebimento (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 font-mono">
                {formatCurrency(expected30d)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-subtle">
            <CardContent className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2 lg:col-span-3 shadow-subtle border-t-4 border-t-rose-500">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <CardTitle>Painel de Cobrança (CRM)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Dias Atraso</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueList.map((t) => {
                  const p = state.parceiros.find((x) => x.id === t.Parceiro_Vinculado)
                  const days = differenceInDays(new Date(), new Date(t.Data_Vencimento))
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-semibold">
                        {p?.Nome_Razao_Social || 'Desconhecido'}
                      </TableCell>
                      <TableCell>{format(new Date(t.Data_Vencimento), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right font-mono text-rose-600 font-bold">
                        {days} dias
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(t.Valor_Total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-primary border-primary hover:bg-primary/10"
                          onClick={() =>
                            openWhatsApp(
                              p?.Telefone_WhatsApp,
                              `Olá ${p?.Nome_Razao_Social}, verificamos um débito em aberto no valor de ${formatCurrency(t.Valor_Total)}. Podemos ajudar?`,
                            )
                          }
                          disabled={!p?.Telefone_WhatsApp}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" /> Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {overdueList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhuma inadimplência no período.
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
