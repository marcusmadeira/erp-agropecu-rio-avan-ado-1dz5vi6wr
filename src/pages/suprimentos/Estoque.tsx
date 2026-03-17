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
import { Box, BrainCircuit } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Estoque() {
  const { state } = useAppStore()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="text-emerald-900 w-8 h-8" />
          <h2 className="text-2xl font-bold text-emerald-900">Estoque de Insumos</h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {state.userRole !== 3 && (
            <Button
              variant="outline"
              asChild
              className="flex-1 sm:flex-none text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold shadow-sm"
            >
              <Link to="/previsao-demanda">
                <BrainCircuit className="w-4 h-4 mr-2" /> Previsão IA
              </Link>
            </Button>
          )}
          <Button className="flex-1 sm:flex-none bg-emerald-800 shadow-sm">Nova Entrada</Button>
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
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
