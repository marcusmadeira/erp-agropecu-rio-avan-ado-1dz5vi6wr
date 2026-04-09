import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { FileText, Download } from 'lucide-react'
import { formatCurrency } from './utils'
import { exportToPDF } from '@/lib/export'
import { useAuth } from '@/hooks/use-auth'

export default function BoletosRecebidos({ boletos }: { boletos: any[] }) {
  const recebidos = boletos
    .filter((b) => b.status_boleto === 'Pago')
    .sort((a, b) => {
      const da = a.expand?.parcela_id?.data_pagamento || a.updated
      const db = b.expand?.parcela_id?.data_pagamento || b.updated
      return new Date(db).getTime() - new Date(da).getTime()
    })

  const { user } = useAuth()

  const handleRecibo = (b: any) => {
    const cliente =
      b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D'
    const dataPag = b.expand?.parcela_id?.data_pagamento || b.updated

    exportToPDF({
      title: 'Recibo de Pagamento - ' + (b.numero_boleto || 'Avulso'),
      userName: user?.name,
      data: [
        { desc: 'Cliente', valor: cliente },
        { desc: 'Boleto Nº', valor: b.numero_boleto || '-' },
        {
          desc: 'Vencimento Original',
          valor: b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-',
        },
        { desc: 'Data do Pagamento', valor: format(new Date(dataPag), 'dd/MM/yyyy') },
        { desc: 'Valor Recebido', valor: formatCurrency(b.valor_boleto) },
      ],
      columns: [
        { header: 'Descrição', dataKey: 'desc' },
        { header: 'Informação', dataKey: 'valor' },
      ],
    })
  }

  return (
    <div className="mt-4">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Boleto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recebidos.map((b) => {
              const cliente =
                b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
                'N/D'
              const dataPag = b.expand?.parcela_id?.data_pagamento || b.updated
              return (
                <TableRow key={b.id}>
                  <TableCell>{cliente}</TableCell>
                  <TableCell>{b.numero_boleto || '-'}</TableCell>
                  <TableCell>{formatCurrency(b.valor_boleto)}</TableCell>
                  <TableCell>
                    {b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium text-green-700">
                    {format(new Date(dataPag), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="space-x-2 flex">
                    {b.url_boleto_pdf && (
                      <Button variant="ghost" className="w-12 h-12" asChild>
                        <a href={b.url_boleto_pdf} target="_blank" rel="noreferrer">
                          <FileText className="w-5 h-5" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" className="h-12" onClick={() => handleRecibo(b)}>
                      <Download className="w-5 h-5 mr-1" /> Recibo
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {recebidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum boleto recebido.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {recebidos.map((b) => {
          const cliente =
            b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D'
          const dataPag = b.expand?.parcela_id?.data_pagamento || b.updated

          return (
            <Card key={b.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{cliente}</h3>
                    <p className="text-sm text-muted-foreground">
                      Boleto: {b.numero_boleto || '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium">{formatCurrency(b.valor_boleto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencimento</p>
                    <p className="font-medium">
                      {b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Pagamento</p>
                    <p className="font-medium text-green-700">
                      {format(new Date(dataPag), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {b.url_boleto_pdf && (
                    <Button variant="outline" className="flex-1 h-12" asChild>
                      <a href={b.url_boleto_pdf} target="_blank" rel="noreferrer">
                        <FileText className="w-5 h-5 mr-2" /> PDF
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-[2] h-12"
                    onClick={() => handleRecibo(b)}
                  >
                    <Download className="w-5 h-5 mr-2" /> Gerar Recibo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {recebidos.length === 0 && (
          <p className="text-center text-muted-foreground p-4">Nenhum boleto recebido.</p>
        )}
      </div>
    </div>
  )
}
