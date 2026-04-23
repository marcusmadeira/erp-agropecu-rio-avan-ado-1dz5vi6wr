import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

export default function FinanceCalendar({ transactions }: { transactions?: any[] }) {
  const [boletos, setBoletos] = useState<any[]>([])

  useEffect(() => {
    const fetchBoletos = async () => {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      try {
        const data = await pb.collection('boletos_pagar').getFullList({
          filter: `data_vencimento >= "${firstDay} 00:00:00" && data_vencimento <= "${lastDay} 23:59:59"`,
          expand: 'fornecedor_id,despesa_id',
        })
        setBoletos(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchBoletos()
  }, [])

  const totalPendente = boletos
    .filter((b) => b.status === 'Pendente' || b.status === 'Atrasado')
    .reduce((acc, t) => acc + t.valor, 0)
  const totalPago = boletos.filter((b) => b.status === 'Pago').reduce((acc, t) => acc + t.valor, 0)

  const calendarDays = useMemo(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const days = []

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const evs = boletos.filter((t) => {
        const d = new Date(t.data_vencimento)
        return d.getDate() === i && d.getMonth() === today.getMonth()
      })
      days.push({ date: i, events: evs, isToday: i === today.getDate() })
    }
    return days
  }, [boletos])

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <CardTitle className="text-emerald-900">Calendário de Despesas (Mês Atual)</CardTitle>
        <CardDescription>
          Pendente: <strong className="text-amber-600">{formatCurrency(totalPendente)}</strong> |{' '}
          Pago: <strong className="text-emerald-600">{formatCurrency(totalPago)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-gray-500 py-1">
              {d}
            </div>
          ))}
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`min-h-16 sm:min-h-24 p-1 sm:p-2 border rounded-md ${d?.isToday ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}
            >
              {d && (
                <>
                  <div
                    className={`text-xs font-bold ${d.isToday ? 'text-emerald-700' : 'text-gray-400'}`}
                  >
                    {d.date}
                  </div>
                  <div className="mt-1 space-y-1">
                    {d.events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] leading-tight p-1 rounded truncate ${
                          ev.status === 'Pago'
                            ? 'bg-emerald-100 text-emerald-800 line-through opacity-70'
                            : ev.status === 'Atrasado'
                              ? 'bg-red-100 text-red-800 font-medium'
                              : 'bg-amber-100 text-amber-800 font-medium'
                        }`}
                        title={`${ev.expand?.fornecedor_id?.nome_razao_social || 'Despesa'} - ${formatCurrency(ev.valor)}`}
                      >
                        {ev.status === 'Pago' ? '✓' : '•'} {formatCurrency(ev.valor)}
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
