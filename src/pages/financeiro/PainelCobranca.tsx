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
  const [stats, setStats] = useState({ recebido: 0, aReceber: 0, atrasado: 0, vencendo7d: 0 })
  const [parcelas, setParcelas] = useState<any[]>([])

  useEffect(() => {
    pb.collection('parcelas_venda')
      .getFullList({ expand: 'venda_id.cliente_id' })
      .then((res) => {
        setParcelas(res)
        const now = new Date().getTime()
        const sevenDays = now + 7 * 24 * 3600 * 1000

        let recebido = 0
        let aReceber = 0
        let atrasado = 0
        let vencendo7d = 0

        res.forEach((p) => {
          const valor = p.valor_parcela || 0
          const vDate = p.data_vencimento ? new Date(p.data_vencimento).getTime() : 0
          const isPaga = p.status_parcela === 'Paga'
          const isAtrasada =
            (!isPaga && p.status_parcela === 'Atrasada') || (!isPaga && vDate && vDate < now)

          if (isPaga) {
            recebido += valor
          } else if (isAtrasada) {
            atrasado += valor
          } else if (p.status_parcela !== 'Cancelada') {
            aReceber += valor
            if (vDate && vDate <= sevenDays) {
              vencendo7d += valor
            }
          }
        })

        setStats({ recebido, aReceber, atrasado, vencendo7d })
      })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Painel de Cobrança</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 text-sm">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.recebido)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 text-sm">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.aReceber)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-700 text-sm">Vencendo (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.vencendo7d)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-sm">Inadimplência (Vencido)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.atrasado)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relação de Parcelas</CardTitle>
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
              {parcelas.map((p) => {
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
              {parcelas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma parcela encontrada.
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
