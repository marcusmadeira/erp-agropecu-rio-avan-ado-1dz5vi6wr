import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Transacao } from '@/stores/types'
import { formatCurrency } from '@/components/dashboard/KpiCards'

export default function FinanceCalendar({ transactions }: { transactions: Transacao[] }) {
  const currentMonthFixos = useMemo(() => {
    const today = new Date()
    return transactions
      .filter((t) => {
        if (t.Classificacao_Custo !== 'Fixo' && t.Tipo_Movimento !== 'Despesa') return false
        const d = new Date(t.Data_Vencimento)
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
      })
      .sort((a, b) => new Date(a.Data_Vencimento).getTime() - new Date(b.Data_Vencimento).getTime())
  }, [transactions])

  const totalFixoMes = currentMonthFixos.reduce((acc, t) => acc + t.Valor_Total, 0)

  // Generate simple 7-col grid for current month
  const calendarDays = useMemo(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const days = []

    // Padding start
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    // Days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i)
      const evs = currentMonthFixos.filter((t) => new Date(t.Data_Vencimento).getDate() === i)
      days.push({ date: i, events: evs, isToday: i === today.getDate() })
    }
    return days
  }, [currentMonthFixos])

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <CardTitle className="text-secondary">Calendário de Custos Fixos (Mês Atual)</CardTitle>
        <CardDescription>
          Total Projetado:{' '}
          <strong className="text-destructive">{formatCurrency(totalFixoMes)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-slate-500 py-1">
              {d}
            </div>
          ))}
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`min-h-16 sm:min-h-24 p-1 sm:p-2 border rounded-md ${d?.isToday ? 'bg-primary/5 border-primary/30' : 'bg-white border-slate-100'}`}
            >
              {d && (
                <>
                  <div
                    className={`text-xs font-bold ${d.isToday ? 'text-primary' : 'text-slate-400'}`}
                  >
                    {d.date}
                  </div>
                  <div className="mt-1 space-y-1">
                    {d.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] leading-tight bg-slate-100 p-1 rounded text-secondary truncate"
                        title={`${ev.Descricao_Lancamento} - ${formatCurrency(ev.Valor_Total)}`}
                      >
                        {ev.Status_Pagamento === 'Efetivado' ? '✓' : '•'}{' '}
                        {formatCurrency(ev.Valor_Total)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
