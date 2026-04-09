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
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { MessageSquare, Mail, DollarSign } from 'lucide-react'
import { registrarPagamento, registrarHistoricoCobranca } from '@/services/financeiro_recebimentos'
import { formatCurrency, calcularAtraso } from './utils'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function BoletosPendentes({
  boletos,
  onRefresh,
}: {
  boletos: any[]
  onRefresh: () => void
}) {
  const [busca, setBusca] = useState('')
  const pendentes = boletos
    .filter(
      (b) =>
        b.status_boleto === 'Gerado' ||
        b.status_boleto === 'Enviado' ||
        b.status_boleto === 'Pendente',
    )
    .filter((b) => {
      const cliente =
        b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || ''
      return cliente.toLowerCase().includes(busca.toLowerCase())
    })
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())

  const [pagamentoData, setPagamentoData] = useState({
    id: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleWhatsApp = async (b: any) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    const fone = cliente?.contato_whatsapp || ''
    const msg = `Olá, lembrete de vencimento do boleto ${b.numero_boleto} no valor de ${formatCurrency(b.valor_boleto)} para ${format(new Date(b.data_vencimento), 'dd/MM/yyyy')}.`
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank')
    await registrarHistoricoCobranca(b.id, {
      cliente_id: cliente?.id,
      tipo_cobranca: 'WhatsApp',
      status: 'Enviado',
      resultado: 'Lembrete enviado',
    })
    toast.success('Cobrança registrada!')
    onRefresh()
  }

  const handleEmail = async (b: any) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    try {
      await pb.send(`/backend/v1/boletos/${b.id}/enviar-email`, { method: 'POST' })
      await registrarHistoricoCobranca(b.id, {
        cliente_id: cliente?.id,
        tipo_cobranca: 'Email',
        status: 'Enviado',
        resultado: 'Boleto por email',
      })
      toast.success('Email enviado com sucesso!')
      onRefresh()
    } catch (err) {
      toast.error('Erro ao enviar email')
    }
  }

  const handlePagar = async () => {
    try {
      await registrarPagamento(pagamentoData.id, {
        valor_pago: pagamentoData.valor,
        data_pagamento: pagamentoData.data,
      })
      toast.success('Pagamento registrado com sucesso!')
      setDialogOpen(false)
      onRefresh()
    } catch (err) {
      toast.error('Erro ao registrar pagamento')
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Input
          placeholder="Buscar por cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Boleto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Dias P/ Vencer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendentes.map((b) => {
            const cliente =
              b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D'
            const { diasAtraso } = calcularAtraso(b.data_vencimento, b.valor_boleto)
            const diasParaVencer =
              diasAtraso > 0
                ? -diasAtraso
                : Math.floor(
                    (new Date(b.data_vencimento).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  )

            return (
              <TableRow key={b.id}>
                <TableCell>{cliente}</TableCell>
                <TableCell>{b.numero_boleto || '-'}</TableCell>
                <TableCell>{formatCurrency(b.valor_boleto)}</TableCell>
                <TableCell>
                  {b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell>{diasParaVencer}</TableCell>
                <TableCell>
                  <Badge variant="outline">{b.status_boleto}</Badge>
                </TableCell>
                <TableCell className="space-x-2 flex">
                  <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(b)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEmail(b)}>
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setPagamentoData({
                        id: b.id,
                        valor: b.valor_boleto,
                        data: new Date().toISOString().split('T')[0],
                      })
                      setDialogOpen(true)
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-1" /> Pagar
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
          {pendentes.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Nenhum boleto pendente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor Pago</Label>
              <Input
                type="number"
                value={pagamentoData.valor}
                onChange={(e) =>
                  setPagamentoData({ ...pagamentoData, valor: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={pagamentoData.data}
                onChange={(e) => setPagamentoData({ ...pagamentoData, data: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePagar}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
