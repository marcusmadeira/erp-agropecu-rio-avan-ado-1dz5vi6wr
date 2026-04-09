import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getNascimentos, deleteNascimento, NascimentoDesmama } from '@/services/nascimentos'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function Nascimentos() {
  const [nascimentos, setNascimentos] = useState<NascimentoDesmama[]>([])
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await getNascimentos()
      setNascimentos(data)
    } catch (err) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('nascimentos_e_desmama', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (confirm('Excluir registro de nascimento?')) {
      try {
        await deleteNascimento(id)
        toast({ title: 'Registro excluído' })
      } catch (e) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Nascimentos e Desmama</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matriz Mãe</TableHead>
                <TableHead>Data Nascimento</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Peso Nascer (kg)</TableHead>
                <TableHead>Status Cria</TableHead>
                <TableHead>RGN Provisório</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nascimentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
              {nascimentos.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.expand?.matriz_mae_id?.id_manejo_brinco}</TableCell>
                  <TableCell>{new Date(n.data_nascimento).toLocaleDateString()}</TableCell>
                  <TableCell>{n.sexo || '-'}</TableCell>
                  <TableCell>{n.peso_nascer || '-'}</TableCell>
                  <TableCell>{n.status_cria || '-'}</TableCell>
                  <TableCell>{n.rgn_provisorio_abcz || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
