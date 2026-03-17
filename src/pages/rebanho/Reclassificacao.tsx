import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function Reclassificacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const poAnimals = state.animais.filter((a) => a.costCenter === 'CC01-PO' && a.status === 'Ativo')

  const handleReclassificar = (animalId: string) => {
    dispatch((s) => ({
      ...s,
      animais: s.animais.map((a) =>
        a.id === animalId ? { ...a, costCenter: 'CC02-TIP', status: 'Reclassificado (TIP)' } : a,
      ),
    }))
    toast({
      title: 'Animal Reclassificado!',
      description: 'Movido para o Centro de Custo Comercial TIP.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-bold text-emerald-900">
          Reclassificação de Matrizes (Descarte PO)
        </h2>
      </div>
      <p className="text-muted-foreground">
        Animais PO com falhas reprodutivas ou fenótipo indesejado devem ser movidos para terminação
        comercial (TIP).
      </p>

      <Card className="shadow-subtle border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Animais PO Elegíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Centro de Custo Atual</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poAnimals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold">{a.brinco}</TableCell>
                  <TableCell>{a.categoria}</TableCell>
                  <TableCell>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">
                      {a.costCenter}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => handleReclassificar(a.id)}
                    >
                      Mover p/ TIP <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {poAnimals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum animal PO ativo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
