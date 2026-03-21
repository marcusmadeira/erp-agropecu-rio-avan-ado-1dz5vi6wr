import { useState, useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import FinanceSummary from '@/components/dashboard/FinanceSummary'
import FinanceCharts from '@/components/dashboard/FinanceCharts'
import FinanceCalendar from '@/components/dashboard/FinanceCalendar'

export default function Dashboard() {
  const { state } = useAppStore()
  const [filter, setFilter] = useState('ano_pecuario')

  const filteredTxs = useMemo(() => {
    let start = new Date(0)
    let end = new Date(8640000000000000) // max date
    const now = new Date()

    if (filter === 'ano_pecuario') {
      let startYear = now.getFullYear()
      if (now.getMonth() < 6) startYear-- // Before July
      start = new Date(startYear, 6, 1) // July 1st
      end = new Date(startYear + 1, 5, 30) // June 30th
    } else if (filter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (filter === 'quarter') {
      const q = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), q * 3, 1)
      end = new Date(now.getFullYear(), q * 3 + 3, 0)
    }

    return state.transacoes.filter((t) => {
      const d = new Date(t.Data_Vencimento || t.Data_Competencia)
      return d >= start && d <= end
    })
  }, [state.transacoes, filter])

  if (state.userRole === 3) {
    return (
      <div className="space-y-4 animate-fade-in p-4 sm:p-0">
        <h2 className="text-2xl font-bold text-primary mb-4 tracking-tight">
          Painel Operacional (Campo)
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 h-16 text-lg shadow-md rounded-xl font-bold"
              >
                <Link to="/pesagem">Curral Digital (Pesagem)</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 h-16 text-lg shadow-md rounded-xl font-bold"
              >
                <Link to="/manejo">Manejo Diário (Trato)</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 h-16 text-lg shadow-md rounded-xl font-bold"
              >
                <Link to="/fabrica-racao">Fábrica de Ração (Batida)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-primary tracking-tight">
          Dashboard Financeiro (DRE)
        </h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-white border-border">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ano_pecuario">Ano Pecuário (Jul-Jun)</SelectItem>
            <SelectItem value="month">Mês Atual</SelectItem>
            <SelectItem value="quarter">Trimestre Atual</SelectItem>
            <SelectItem value="all">Todo o Período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FinanceSummary transactions={filteredTxs} />
      <FinanceCharts transactions={filteredTxs} />
      <FinanceCalendar transactions={state.transacoes} />
    </div>
  )
}
