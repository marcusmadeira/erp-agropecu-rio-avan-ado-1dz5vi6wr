import { useEffect, useState } from 'react'
import { getIatfs } from '@/services/reproducao'
import { format, differenceInDays, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle } from 'lucide-react'

export default function SemaforoTab() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    getIatfs()
      .then((res) => {
        const prenhes = res
          .filter((r) => r.resultado_dg === 'Prenhe' && r.data_provavel_parto_dpp)
          .map((r) => {
            const days = differenceInDays(
              parseISO(r.data_provavel_parto_dpp.split(' ')[0]),
              new Date(),
            )
            let color = 'bg-emerald-500'
            let label = 'Verde (>30d)'
            if (days <= 15) {
              color = 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              label = 'Vermelho (Crítico)'
            } else if (days <= 30) {
              color = 'bg-amber-500'
              label = 'Amarelo (Atenção)'
            }
            return { ...r, days, color, label }
          })
          .sort((a, b) => a.days - b.days)
        setData(prenhes)
      })
      .catch((e) => {
        console.error(e)
      })
  }, [])

  return (
    <Card className="border-t-4 border-t-rose-500 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl font-bold text-primary">Semáforo de Maternidade</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Status</TableHead>
                <TableHead>Matriz</TableHead>
                <TableHead>Touro Utilizado</TableHead>
                <TableHead>Data IATF</TableHead>
                <TableHead>DPP (Previsão)</TableHead>
                <TableHead className="text-right">Dias Restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className={`w-4 h-4 rounded-full ${item.color}`} title={item.label} />
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {item.expand?.matriz_id?.id_manejo_brinco}
                  </TableCell>
                  <TableCell>{item.expand?.touro_utilizado_id?.id_manejo_brinco || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(item.data_iatf.replace(' ', 'T')), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {format(new Date(item.data_provavel_parto_dpp.replace(' ', 'T')), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg text-slate-800">
                    {item.days < 0 ? 'Atrasado' : item.days}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground font-medium"
                  >
                    Nenhuma matriz com previsão de parto próxima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
