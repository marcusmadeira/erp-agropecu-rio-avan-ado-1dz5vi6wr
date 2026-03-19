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

export default function MaternidadeAlerts() {
  const { state } = useAppStore()

  // Include recent births visually
  const events = state.reproducoes
    .filter((r) => r.status === 'Prenhe' || r.status === 'Parida')
    .sort((a, b) => new Date(a.dpp).getTime() - new Date(b.dpp).getTime())
    .slice(0, 6)

  const getAlertStatus = (dpp: string, status: string) => {
    if (status === 'Parida')
      return (
        <span
          className="w-3 h-3 rounded-full bg-white border border-slate-400 block"
          title="Parto Realizado (Branco)"
        />
      )

    const days = differenceInDays(parseISO(dpp), new Date())
    if (days <= 15)
      return (
        <span
          className="w-3 h-3 rounded-full bg-red-500 animate-pulse block"
          title="Alerta Vermelho: <= 15 dias"
        />
      )
    if (days <= 30)
      return (
        <span
          className="w-3 h-3 rounded-full bg-amber-500 block"
          title="Alerta Amarelo: <= 30 dias"
        />
      )

    return (
      <span className="w-3 h-3 rounded-full bg-emerald-500 block" title="Alerta Verde: > 30 dias" />
    )
  }

  return (
    <Card className="shadow-subtle mt-4 border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="text-emerald-900 flex items-center gap-2">
          Alertas de Maternidade (Próximos Partos)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Matriz (Brinco)</TableHead>
              <TableHead>DPP</TableHead>
              <TableHead>Dias Restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma matriz próxima do parto.
                </TableCell>
              </TableRow>
            )}
            {events.map((r) => {
              const animal = state.animais.find((a) => a.id === r.animalId)
              const days = differenceInDays(parseISO(r.dpp), new Date())
              return (
                <TableRow key={r.id}>
                  <TableCell>{getAlertStatus(r.dpp, r.status)}</TableCell>
                  <TableCell className="font-medium">{animal?.brinco || 'Desconhecido'}</TableCell>
                  <TableCell>{format(parseISO(r.dpp), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-mono">
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
