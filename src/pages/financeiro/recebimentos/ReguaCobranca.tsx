import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, differenceInDays } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { BellRing, CheckCircle, MailWarning } from 'lucide-react'

export default function ReguaCobranca({ historico, boletos }: any) {
  const hoje = new Date()

  const dMinus2 = boletos.filter(
    (b: any) =>
      b.status_boleto !== 'Pago' &&
      b.status_boleto !== 'Cancelado' &&
      differenceInDays(new Date(b.data_vencimento), hoje) === 2,
  )
  const d0 = boletos.filter(
    (b: any) =>
      b.status_boleto !== 'Pago' &&
      b.status_boleto !== 'Cancelado' &&
      differenceInDays(new Date(b.data_vencimento), hoje) === 0,
  )
  const dPlus1 = boletos.filter(
    (b: any) =>
      b.status_boleto !== 'Pago' &&
      b.status_boleto !== 'Cancelado' &&
      differenceInDays(hoje, new Date(b.data_vencimento)) === 1,
  )

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[#094016]">Workflow de Automação de Cobrança</h3>
        <p className="text-sm text-muted-foreground">
          Acompanhamento dos envios automáticos baseados nas datas de vencimento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-blue-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <BellRing className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-sm font-medium">D-2 (Lembrete Prévio)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dMinus2.length}</div>
            <p className="text-xs text-muted-foreground">Boletos no pipeline p/ hoje</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-green-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <CardTitle className="text-sm font-medium">D-0 (Dia do Vencimento)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{d0.length}</div>
            <p className="text-xs text-muted-foreground">Alertas de vencimento ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-red-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <MailWarning className="w-5 h-5 text-red-500" />
            <CardTitle className="text-sm font-medium">D+1 (Aviso de Atraso)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{dPlus1.length}</div>
            <p className="text-xs text-muted-foreground">Notificações de quebra enviadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-white shadow-sm mt-8">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800">Log de Disparos Recentes</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Meio/Tipo</TableHead>
              <TableHead>Status Log</TableHead>
              <TableHead>Resultado Execução</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.slice(0, 15).map((h: any) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {h.data_cobranca ? format(new Date(h.data_cobranca), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell>{h.expand?.cliente_id?.nome_razao_social || 'N/D'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-slate-100">
                    {h.tipo_cobranca}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      h.status_cobranca === 'Entregue' ||
                      h.status_cobranca === 'Respondido' ||
                      h.status_cobranca === 'Sucesso'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {h.status_cobranca}
                  </Badge>
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm max-w-[250px] truncate"
                  title={h.resultado}
                >
                  {h.resultado}
                </TableCell>
              </TableRow>
            ))}
            {historico.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  O histórico de automação está vazio.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
