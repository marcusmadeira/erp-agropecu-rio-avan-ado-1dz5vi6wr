import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function HistoricoCobrancas({ historico }: { historico: any[] }) {
  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data / Hora</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Boleto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historico.map((h) => {
            const cliente = h.expand?.cliente_id?.nome_razao_social || 'N/D'
            const boleto = h.expand?.boleto_id?.numero_boleto || 'N/D'
            return (
              <TableRow key={h.id}>
                <TableCell>
                  {h.data_cobranca ? format(new Date(h.data_cobranca), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell>{cliente}</TableCell>
                <TableCell>{boleto}</TableCell>
                <TableCell>{h.tipo_cobranca}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{h.status_cobranca}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={h.mensagem_enviada}>
                  {h.mensagem_enviada || '-'}
                </TableCell>
                <TableCell>{h.resultado}</TableCell>
              </TableRow>
            )
          })}
          {historico.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum histórico registrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
