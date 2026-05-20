import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity } from 'lucide-react'

export default function Inventario() {
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('animais')
      .getFullList({
        filter: "status != 'Vendido' && status != 'Morto'",
        expand: 'lote_atual_id,piquete_atual_id',
      })
      .then(setAnimais)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6">Carregando inventário...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-emerald-900">Inventário Geral</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900/70">
              Total de Cabeças (Ativos)
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{animais.length}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Relação de Animais</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Pasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animais.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.id_manejo_brinco}</TableCell>
                  <TableCell>{a.categoria}</TableCell>
                  <TableCell>{a.peso_atual_kg}</TableCell>
                  <TableCell>{a.expand?.lote_atual_id?.nome_lote || '-'}</TableCell>
                  <TableCell>{a.expand?.piquete_atual_id?.nome || '-'}</TableCell>
                </TableRow>
              ))}
              {animais.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhum animal ativo no sistema.
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
