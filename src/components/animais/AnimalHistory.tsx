import { format, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PesagemChart from '@/components/pesagem/PesagemChart'

export function AnimalHistory({ pesagens, animalId }: { pesagens: any[]; animalId: string }) {
  const sorted = [...pesagens].sort(
    (a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime(),
  )

  return (
    <div className="space-y-6">
      <PesagemChart data={pesagens} animalFilter={animalId} />

      <Card>
        <CardHeader>
          <CardTitle>Registros de Pesagem</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhuma pesagem registrada para este animal.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>GMD Calculado</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p, i) => {
                  let gmdText = '-'
                  if (i < sorted.length - 1) {
                    const prev = sorted[i + 1]
                    const days =
                      (new Date(p.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) /
                      (1000 * 3600 * 24)
                    if (days > 0) {
                      const gmd = (p.peso_kg - prev.peso_kg) / days
                      gmdText = gmd.toFixed(3) + ' kg/dia'
                    }
                  }
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{format(parseISO(p.data_pesagem), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold text-[#094016]">{p.peso_kg}</TableCell>
                      <TableCell>{gmdText}</TableCell>
                      <TableCell>{p.responsavel_pesagem || '-'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
