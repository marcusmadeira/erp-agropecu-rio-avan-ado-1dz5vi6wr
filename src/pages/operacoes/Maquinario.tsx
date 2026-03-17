import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tractor } from 'lucide-react'

export default function Maquinario() {
  const { state } = useAppStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Tractor className="w-8 h-8 text-emerald-900" />
        <h2 className="text-2xl font-bold text-emerald-900">Frota e Maquinário</h2>
      </div>

      <Card className="shadow-subtle mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead className="text-right">Horímetro/Km Atual</TableHead>
                <TableHead className="text-right">Próxima Revisão</TableHead>
                <TableHead>Status Revisão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.maquinario.map((m) => {
                const needsRevision = m.horimetro >= m.nextRevision
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-semibold">{m.name}</TableCell>
                    <TableCell className="text-right font-mono">{m.horimetro}</TableCell>
                    <TableCell className="text-right font-mono">{m.nextRevision}</TableCell>
                    <TableCell>
                      {needsRevision ? (
                        <Badge variant="destructive" className="animate-pulse">
                          Revisão Vencida!
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-emerald-600">
                          Ok
                        </Badge>
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
