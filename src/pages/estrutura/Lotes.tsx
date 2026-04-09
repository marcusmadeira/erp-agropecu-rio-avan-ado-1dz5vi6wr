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
import { getLotes } from '@/services/lotes'
import { useRealtime } from '@/hooks/use-realtime'

import LoteForm from '@/pages/cadastros/LoteForm'

export default function Lotes() {
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const loadData = async () => {
    try {
      const data = await getLotes()
      setLotes(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lotes', () => {
    loadData()
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Lotes</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setEditingItem(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Lote
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Lotes</CardTitle>
          <CardDescription>Acompanhe os lotes do seu rebanho e seus custos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Carregando...</div>
          ) : lotes.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              Nenhum lote encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead className="text-right">Qtd. Cabeças</TableHead>
                  <TableHead className="text-right">Peso Médio (kg)</TableHead>
                  <TableHead className="text-right">Custo Nutrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.nome_lote}</TableCell>
                    <TableCell>{l.centro_custo}</TableCell>
                    <TableCell className="text-right">{l.quantidade_cabecas}</TableCell>
                    <TableCell className="text-right">{l.peso_medio_lote}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(l.custo_acumulado_nutricao || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LoteForm open={formOpen} onOpenChange={setFormOpen} item={editingItem} />
    </div>
  )
}
