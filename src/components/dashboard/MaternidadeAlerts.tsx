import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { differenceInDays, format, parseISO } from 'date-fns'
import useAppStore from '@/stores/useAppStore'
import { Baby } from 'lucide-react'

export default function MaternidadeAlerts() {
  const { state } = useAppStore()

  // Include recent births visually and sort by alert status
  const events = state.reproducoes
    .filter((r) => r.status === 'Prenhe' || r.status === 'Parida')
    .sort((a, b) => new Date(a.dpp).getTime() - new Date(b.dpp).getTime())
    .slice(0, 8)

  const getAlertStatus = (dpp: string, status: string) => {
    if (status === 'Parida') return <span title="Parto Realizado">⚪</span>

    const days = differenceInDays(parseISO(dpp), new Date())
    if (days <= 15)
      return (
        <span className="animate-pulse block text-lg" title="Alerta Vermelho: <= 15 dias">
          🔴
        </span>
      )
    if (days <= 30)
      return (
        <span className="block text-lg" title="Alerta Amarelo: 16-30 dias">
          🟡
        </span>
      )

    return (
      <span className="block text-lg" title="Alerta Verde: > 30 dias">
        🟢
      </span>
    )
  }

  return (
    <Card className="shadow-subtle mt-4 border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Baby className="w-5 h-5" /> Painel de Maternidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Status</TableHead>
              <TableHead>Matriz (Brinco)</TableHead>
              <TableHead>DPP</TableHead>
              <TableHead>Dias Restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground font-medium py-4"
                >
                  Nenhuma matriz próxima do parto.
                </TableCell>
              </TableRow>
            )}
            {events.map((r) => {
              const animal = state.animais.find((a) => a.id === r.animalId)
              const days = differenceInDays(parseISO(r.dpp), new Date())
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-center">{getAlertStatus(r.dpp, r.status)}</TableCell>
                  <TableCell className="font-bold">{animal?.brinco || 'Desconhecido'}</TableCell>
                  <TableCell className="font-mono font-medium">
                    {format(parseISO(r.dpp), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-700">
                    {r.status === 'Parida' ? 'Parida' : `${Math.max(0, days)} dias`}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
