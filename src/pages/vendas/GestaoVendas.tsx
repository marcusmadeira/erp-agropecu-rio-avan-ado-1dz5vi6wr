import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function GestaoVendas() {
  const [vendas, setVendas] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])

  useEffect(() => {
    pb.collection('vendas').getFullList({ expand: 'cliente_id' }).then(setVendas)
    pb.collection('eventos_venda').getFullList().then(setEventos)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Gestão de Vendas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Eventos de Venda Ativos</CardTitle>
          <CardDescription>Leilões, Feiras e Eventos da Fazenda</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {e.data_evento ? new Date(e.data_evento).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="font-semibold">{e.nome_evento}</TableCell>
                  <TableCell>{e.tipo_evento}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'Finalizado' ? 'secondary' : 'default'}>
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {eventos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum evento registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas (Avulsas e Eventos)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    {v.data_venda ? new Date(v.data_venda).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {v.expand?.cliente_id?.nome_razao_social || 'Desconhecido'}
                  </TableCell>
                  <TableCell className="font-mono text-emerald-700 font-semibold">
                    {formatCurrency(v.valor_total_venda || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status_venda === 'Confirmada' ? 'default' : 'secondary'}>
                      {v.status_venda}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {vendas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhuma venda registrada.
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
