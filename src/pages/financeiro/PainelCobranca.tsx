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

export default function PainelCobranca() {
  const [stats, setStats] = useState({ recebido: 0, aReceber: 0, atrasado: 0 })
  const [boletos, setBoletos] = useState<any[]>([])

  useEffect(() => {
    pb.collection('boletos')
      .getFullList({ expand: 'parcela_id.venda_id.cliente_id' })
      .then((res) => {
        setBoletos(res)
        const recebido = res
          .filter((b) => b.status_boleto === 'Pago')
          .reduce((a, b) => a + (b.valor_boleto || 0), 0)
        const atrasado = res
          .filter(
            (b) =>
              b.status_boleto === 'Atrasado' ||
              (b.status_boleto === 'Pendente' &&
                b.data_vencimento &&
                new Date(b.data_vencimento) < new Date()),
          )
          .reduce((a, b) => a + (b.valor_boleto || 0), 0)
        const aReceber = res
          .filter((b) => ['Pendente', 'Gerado'].includes(b.status_boleto))
          .reduce((a, b) => a + (b.valor_boleto || 0), 0)

        setStats({ recebido, aReceber, atrasado })
      })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-emerald-900">Painel de Cobrança</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emerald-500">
          <CardHeader>
            <CardTitle className="text-emerald-700">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {formatCurrency(stats.recebido)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardHeader>
            <CardTitle className="text-amber-700">A Receber (No prazo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(stats.aReceber)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-700">Inadimplência (Atrasado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.atrasado)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relação de Títulos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boletos.map((b) => {
                const isAtrasado =
                  b.status_boleto === 'Atrasado' ||
                  (b.status_boleto === 'Pendente' &&
                    b.data_vencimento &&
                    new Date(b.data_vencimento) < new Date())
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
                        ?.nome_razao_social || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      {b.data_vencimento ? new Date(b.data_vencimento).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(b.valor_boleto || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.status_boleto === 'Pago'
                            ? 'default'
                            : isAtrasado
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {isAtrasado ? 'Atrasado' : b.status_boleto}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {boletos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
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
