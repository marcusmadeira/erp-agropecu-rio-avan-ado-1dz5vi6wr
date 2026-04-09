import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAnimais } from '@/services/animais'
import { useRealtime } from '@/hooks/use-realtime'

export default function Animais() {
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getAnimais()
      setAnimais(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('animais', () => {
    loadData()
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Animais</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Animal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Animais</CardTitle>
          <CardDescription>Controle individual do rebanho.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Carregando...</div>
          ) : animais.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              Nenhum animal encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brinco</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Lote Atual</TableHead>
                  <TableHead className="text-right">Peso (kg)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animais.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.id_manejo_brinco}</TableCell>
                    <TableCell>{a.categoria}</TableCell>
                    <TableCell>{a.expand?.lote_atual?.nome_lote || 'Sem lote'}</TableCell>
                    <TableCell className="text-right">{a.peso_atual_kg}</TableCell>
                    <TableCell>{a.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
