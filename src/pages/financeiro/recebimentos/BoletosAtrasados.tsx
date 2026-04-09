import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { MessageSquare, Handshake, XCircle } from 'lucide-react'
import {
  renegociarBoleto,
  cancelarBoleto,
  registrarHistoricoCobranca,
} from '@/services/financeiro_recebimentos'
import { formatCurrency, calcularAtraso } from './utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BoletosAtrasados({
  boletos,
  onRefresh,
}: {
  boletos: any[]
  onRefresh: () => void
}) {
  const atrasados = boletos
    .filter(
      (b) =>
        b.status_boleto === 'Vencido' ||
        (b.status_boleto !== 'Pago' && new Date(b.data_vencimento) < new Date()),
    )
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())

  const [negoData, setNegoData] = useState({ id: '', novo_vencimento: '', justificativa: '' })
  const [negoOpen, setNegoOpen] = useState(false)

  const handleWhatsApp = async (b: any, total: number) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    const fone = cliente?.contato_whatsapp || ''
    const msg = `Olá, identificamos um atraso no boleto ${b.numero_boleto}. O valor atualizado com juros/multa é ${formatCurrency(
      total,
    )}. Por favor, regularize ou entre em contato.`
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank')
    await registrarHistoricoCobranca(b.id, {
      cliente_id: cliente?.id,
      tipo_cobranca: 'WhatsApp',
      status: 'Enviado',
      resultado: 'Cobrança com juros',
    })
    onRefresh()
  }

  const handleRenegociar = async () => {
    try {
      await renegociarBoleto(negoData.id, negoData)
      toast.success('Boleto renegociado!')
      setNegoOpen(false)
      onRefresh()
    } catch {
      toast.error('Erro na renegociação')
    }
  }

  const handleCancelar = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este boleto?')) {
      try {
        await cancelarBoleto(id)
        toast.success('Boleto cancelado')
        onRefresh()
      } catch {
        toast.error('Erro ao cancelar')
      }
    }
  }

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Boleto</TableHead>
            <TableHead>Valor Orig.</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Atraso</TableHead>
            <TableHead>Juros/Multa</TableHead>
            <TableHead>Total Atual</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {atrasados.map((b) => {
            const cliente =
              b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D'
            const { diasAtraso, juros, multa, total } = calcularAtraso(
              b.data_vencimento,
              b.valor_boleto,
            )
            const isCritico = diasAtraso > 30

            return (
              <TableRow key={b.id} className={cn({ 'bg-red-50': isCritico })}>
                <TableCell>{cliente}</TableCell>
                <TableCell>{b.numero_boleto || '-'}</TableCell>
                <TableCell>{formatCurrency(b.valor_boleto)}</TableCell>
                <TableCell>
                  {b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell className={cn({ 'text-red-600 font-bold': isCritico })}>
                  {diasAtraso} d
                </TableCell>
                <TableCell>{formatCurrency(juros + multa)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(total)}</TableCell>
                <TableCell className="space-x-2 flex">
                  <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(b, total)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNegoData({ id: b.id, novo_vencimento: '', justificativa: '' })
                      setNegoOpen(true)
                    }}
                  >
                    <Handshake className="w-4 h-4 mr-1" /> Negociar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleCancelar(b.id)}>
                    <XCircle className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
          {atrasados.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Nenhum boleto em atraso.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={negoOpen} onOpenChange={setNegoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renegociar / Alterar Vencimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Vencimento</Label>
              <Input
                type="date"
                value={negoData.novo_vencimento}
                onChange={(e) => setNegoData({ ...negoData, novo_vencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Justificativa / Acordo</Label>
              <Textarea
                value={negoData.justificativa}
                onChange={(e) => setNegoData({ ...negoData, justificativa: e.target.value })}
                placeholder="Ex: Cliente pediu prorrogação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRenegociar}>Confirmar Negociação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
