import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useAppStore from '@/stores/useAppStore'
import { format, parseISO, differenceInDays } from 'date-fns'

export default function MaternityLight() {
  const { state } = useAppStore()

  const alerts = useMemo(() => {
    return state.reproducoes
      .filter((r) => r.status === 'Prenhe')
      .map((r) => {
        const animal = state.animais.find((a) => a.id === r.animalId)
        const days = differenceInDays(parseISO(r.dpp), new Date())
        let color = 'bg-emerald-500'
        let label = 'Verde (>30d)'
        if (days <= 15) {
          color = 'bg-rose-500 animate-pulse'
          label = 'Vermelho (Crítico)'
        } else if (days <= 30) {
          color = 'bg-amber-500'
          label = 'Amarelo (Atenção)'
        }

        return { ...r, animal: animal?.brinco || 'N/A', days, color, label }
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 10)
  }, [state.reproducoes, state.animais])

  return (
    <Card className="shadow-subtle border-t-4 border-t-rose-500">
      <CardHeader>
        <CardTitle>Semáforo de Maternidade</CardTitle>
        <CardDescription>Próximos nascimentos (Top 10)</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">Farol</TableHead>
              <TableHead>Matriz</TableHead>
              <TableHead>DPP</TableHead>
              <TableHead className="text-right">Dias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className={`w-4 h-4 rounded-full ${a.color}`} title={a.label} />
                </TableCell>
                <TableCell className="font-bold">{a.animal}</TableCell>
                <TableCell className="font-mono text-xs">
                  {format(parseISO(a.dpp), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-slate-700">
                  {Math.max(0, a.days)}
                </TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  Nenhuma matriz prenhe.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
