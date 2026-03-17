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
import { Button } from '@/components/ui/button'
import { Box } from 'lucide-react'

export default function Estoque() {
  const { state } = useAppStore()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Box className="text-emerald-900 w-8 h-8" />
          <h2 className="text-2xl font-bold text-emerald-900">Estoque de Insumos</h2>
        </div>
        <Button className="bg-emerald-800">Nova Entrada</Button>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto / Insumo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantidade Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.estoque.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold">{e.name}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-800 font-bold">
                    {e.quantity} {e.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
