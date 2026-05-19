import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { differenceInDays, format } from 'date-fns'
import { formatCurrency } from './utils'
import { AlertTriangle, MessageCircle } from 'lucide-react'

export default function PainelInadimplencia({ boletos, externalMetrics }: any) {
  const hoje = new Date()
  const atrasados = boletos.filter(
    (b: any) =>
      b.status_boleto === 'Vencido' ||
      b.status_boleto === 'Atrasado' ||
      (b.status_boleto !== 'Pago' &&
        b.status_boleto !== 'Cancelado' &&
        new Date(b.data_vencimento) < hoje),
  )

  const totalValor = atrasados.reduce((acc: number, b: any) => acc + (b.valor_boleto || 0), 0)
  const totalQtd = atrasados.length
  const avgDias =
    totalQtd > 0
      ? atrasados.reduce(
          (acc: number, b: any) =>
            acc + Math.max(0, differenceInDays(hoje, new Date(b.data_vencimento))),
          0,
        ) / totalQtd
      : 0

  const metrics = externalMetrics || {
    totalOpenValue: totalValor,
    overdueCount: totalQtd,
    averageDelayDays: avgDias,
  }

  const handleWhatsApp = (b: any) => {
    const fone =
      b.clientePhone ||
      b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.contato_whatsapp ||
      ''
    const msg = `Olá! Notamos um pequeno atraso no boleto ${b.numero_boleto || ''} no valor de ${formatCurrency(b.valor_boleto)}. Por favor, entre em contato caso necessite de 2ª via ou tenha dúvidas. Obrigado!`
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total em Aberto (Atraso)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalOpenValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qtd. Boletos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.overdueCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Dias em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(metrics.averageDelayDays)} dias
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-white shadow-sm">
        <div className="p-4 border-b bg-slate-50 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="font-semibold text-slate-800">Detalhamento de Inadimplência</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Boleto</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Dias Atraso</TableHead>
              <TableHead>Valor em Aberto</TableHead>
              <TableHead className="text-right">Ação Rápida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(metrics.tableData || []).map((b: any) => {
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.clienteNome || 'N/D'}</TableCell>
                  <TableCell>{b.boleto || 'N/D'}</TableCell>
                  <TableCell>
                    {b.vencimento ? format(new Date(b.vencimento), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-red-600 font-bold">
                    {Math.max(0, b.diasAtraso)} dias
                  </TableCell>
                  <TableCell>{formatCurrency(b.valor)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await import('@/lib/pocketbase/client').then((m) =>
                            m.default.send('/backend/v1/cobranca_whatsapp', {
                              method: 'POST',
                              body: JSON.stringify({ boleto_id: b.id, tipo_mensagem: 'D+1' }),
                            }),
                          )
                          alert('Cobrança via WhatsApp automatizada enviada com sucesso!')
                        } catch (err: any) {
                          alert('Erro ao enviar cobrança: ' + err.message)
                        }
                      }}
                      className="border-green-200 hover:bg-green-50 text-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Cobrar (Auto Bot)
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!metrics.tableData || metrics.tableData.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente inadimplente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
