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

export default function RecebimentoBoletos() {
  const [boletos, setBoletos] = useState<any[]>([])

  useEffect(() => {
    pb.collection('parcelas_venda').getFullList({ expand: 'venda_id.cliente_id' }).then(setBoletos)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Recebimento de Títulos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Parcelas e Títulos a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boletos.map((p) => {
                const now = new Date().getTime()
                const vDate = p.data_vencimento ? new Date(p.data_vencimento).getTime() : 0
                const isAtrasada =
                  p.status_parcela !== 'Paga' &&
                  p.status_parcela !== 'Cancelada' &&
                  (p.status_parcela === 'Atrasada' || (vDate && vDate < now))
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'Desconhecido'}
                    </TableCell>
                    <TableCell>#{p.numero_parcela}</TableCell>
                    <TableCell>
                      {p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(p.valor_parcela || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status_parcela === 'Paga'
                            ? 'default'
                            : isAtrasada
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {isAtrasada ? 'Atrasada' : p.status_parcela}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {boletos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum título encontrado.
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
