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
import { getParceiros } from '@/services/parceiros_negocios'
import { useRealtime } from '@/hooks/use-realtime'

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getParceiros()
      setParceiros(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('parceiros_negocios', () => {
    loadData()
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Parceiros de Negócios</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Parceiros</CardTitle>
          <CardDescription>
            Gerencie fornecedores, clientes, funcionários e transportadoras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Carregando...</div>
          ) : parceiros.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              Nenhum parceiro encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Razão Social</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parceiros.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome_razao_social}</TableCell>
                    <TableCell>
                      {p.numero_documento} {p.tipo_documento ? `(${p.tipo_documento})` : ''}
                    </TableCell>
                    <TableCell>{p.categoria_parceiro}</TableCell>
                    <TableCell>{p.contato_whatsapp}</TableCell>
                    <TableCell>{p.status}</TableCell>
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
