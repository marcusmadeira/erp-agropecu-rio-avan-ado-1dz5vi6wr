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
import { Badge } from '@/components/ui/badge'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function GestaoVendas() {
  const [vendas, setVendas] = useState<any[]>([])

  useEffect(() => {
    pb.collection('vendas').getFullList({ expand: 'cliente_id' }).then(setVendas)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-emerald-900">Gestão de Vendas</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data da Venda</TableHead>
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
                  <TableCell>{v.expand?.cliente_id?.nome_razao_social || 'Desconhecido'}</TableCell>
                  <TableCell className="font-mono">
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
                  <TableCell colSpan={4} className="text-center py-6">
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
