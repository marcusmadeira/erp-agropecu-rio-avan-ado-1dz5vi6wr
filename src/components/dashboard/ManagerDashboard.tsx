import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/components/dashboard/KpiCards'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, isValid } from 'date-fns'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

import { useEffect, useState } from 'react'
import { getConsolidatedFinancials } from '@/services/financeService'

export default function ManagerDashboard() {
  const { state } = useAppStore()

  const [stats, setStats] = useState<any>({
    realizedRevenue: 0,
    realizedExpenses: 0,
    balance: 0,
    allTransactions: [],
  })

  useEffect(() => {
    getConsolidatedFinancials().then(setStats).catch(console.error)
  }, [])

  const receitasMes = stats.realizedRevenue
  const despesasMes = stats.realizedExpenses
  const saldoMes = stats.balance

  const pendentes = (stats.allTransactions || [])
    .filter(
      (t: any) =>
        t.status === 'Pendente' ||
        t.status_pagamento === 'Pendente' ||
        t.status_boleto === 'Pendente' ||
        t.status_parcela === 'Pendente',
    )
    .sort((a: any, b: any) => {
      const dateA = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0
      const dateB = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0
      return dateA - dateB
    })
    .slice(0, 5)

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
    <div className="space-y-4 pb-10 animate-fade-in">
      <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
        Visão Geral - Gerência Financeira
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Receitas Realizadas (Mês)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatCurrency(receitasMes)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Despesas Realizadas (Mês)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 font-mono">
              {formatCurrency(despesasMes)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:-translate-y-1 transition-transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Saldo do Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${saldoMes >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {formatCurrency(saldoMes)}
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts />

      <Card className="shadow-subtle mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-900">
            Próximos Vencimentos (A Pagar / Receber)
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-emerald-700">
            <Link to="/transacoes">
              Ver todas <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendentes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Nenhuma pendência encontrada.
                  </TableCell>
                </TableRow>
              )}
              {pendentes.map((t) => {
                let isOverdue = false
                try {
                  isOverdue = new Date(t.Data_Vencimento).getTime() < new Date().getTime()
                } catch (e) {
                  /* ignore */
                }

                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">
                      {safeFormatDate(t.data_vencimento)}
                      {isOverdue && (
                        <Badge variant="destructive" className="ml-2 px-1 text-[10px]">
                          Atrasado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {t.descricao_lancamento ||
                        t.descricao ||
                        `Parcela/Boleto ${t.numero_boleto || t.numero_parcela || ''}`}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold text-[10px] uppercase px-2 py-1 rounded ${t.tipo_movimento === 'Receita' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}
                      >
                        {t.tipo_movimento}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${t.tipo_movimento === 'Receita' ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {t.tipo_movimento === 'Receita' ? '+' : '-'}
                      {formatCurrency(
                        t.valor_total || t.valor_boleto || t.valor_parcela || t.valor || 0,
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
