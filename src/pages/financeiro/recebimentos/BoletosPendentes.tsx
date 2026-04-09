import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
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
import { Card, CardContent } from '@/components/ui/card'
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
  const { user } = useAuth()
  const isManagerOrAdmin = user?.nivel_acesso === 1 || user?.nivel_acesso === 2

  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const pendentes = boletos
    .filter(
      (b) =>
        b.status_boleto === 'Gerado' ||
        b.status_boleto === 'Enviado' ||
        b.status_boleto === 'Pendente',
    )
    .filter((b) => {
      if (statusFilter !== 'Todos' && b.status_boleto !== statusFilter) return false
      if (dateFrom && new Date(b.data_vencimento) < new Date(dateFrom)) return false
      if (dateTo && new Date(b.data_vencimento) > new Date(dateTo)) return false

      const cliente =
        b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || ''
      return cliente.toLowerCase().includes(busca.toLowerCase())
    })
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())

  const [pagamentoData, setPagamentoData] = useState({
    id: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Pix',
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleWhatsApp = async (b: any) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    const fone = cliente?.contato_whatsapp || ''
    const msg = `Olá, lembrete de vencimento do boleto ${b.numero_boleto || 'N/D'} no valor de ${formatCurrency(b.valor_boleto)} para ${format(new Date(b.data_vencimento), 'dd/MM/yyyy')}.\n\nLinha Digitável: ${b.codigo_barras || 'Não disponível'}\nLink do Boleto: ${b.url_boleto_pdf || 'Não disponível'}`
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank')
    await registrarHistoricoCobranca({
      boleto_id: b.id,
      cliente_id: cliente?.id,
      usuario_id: user?.id,
      data_cobranca: new Date().toISOString(),
      tipo_cobranca: 'WhatsApp',
      status_cobranca: 'Enviado',
      mensagem_enviada: msg,
      resultado: 'Lembrete enviado pelo sistema',
    })
    toast.success('Cobrança registrada!')
    onRefresh()
  }

  const handleEmail = async (b: any) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    try {
      await pb.send(`/backend/v1/boletos/${b.id}/send-email`, { method: 'POST' })
      await registrarHistoricoCobranca({
        boleto_id: b.id,
        cliente_id: cliente?.id,
        usuario_id: user?.id,
        data_cobranca: new Date().toISOString(),
        tipo_cobranca: 'Email',
        status_cobranca: 'Enviado',
        mensagem_enviada: 'Boleto enviado por email',
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
        forma_pagamento: pagamentoData.forma_pagamento,
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Input
            placeholder="Buscar por cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="md:w-64"
          />
          <select
            className="flex h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Gerado">Gerado</option>
            <option value="Enviado">Enviado</option>
            <option value="Pendente">Pendente</option>
          </select>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>
      <div className="hidden md:block">
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
                b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
                'N/D'
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
                    {isManagerOrAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          className="w-12 h-12"
                          onClick={() => handleWhatsApp(b)}
                        >
                          <MessageSquare className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-12 h-12"
                          onClick={() => handleEmail(b)}
                        >
                          <Mail className="w-5 h-5" />
                        </Button>
                        <Button
                          className="h-12"
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
                          <DollarSign className="w-5 h-5 mr-1" /> Pagar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {pendentes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum boleto pendente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
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
            <Card key={b.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{cliente}</h3>
                    <p className="text-sm text-muted-foreground">
                      Boleto: {b.numero_boleto || '-'}
                    </p>
                  </div>
                  <Badge variant="outline">{b.status_boleto}</Badge>
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
                    <p className="text-muted-foreground">Dias P/ Vencer</p>
                    <p className="font-medium">{diasParaVencer}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {isManagerOrAdmin && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => handleWhatsApp(b)}
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => handleEmail(b)}
                      >
                        <Mail className="w-5 h-5" />
                      </Button>
                      <Button
                        className="flex-[2] h-12"
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
                        <DollarSign className="w-5 h-5 mr-1" /> Pagar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {pendentes.length === 0 && (
          <p className="text-center text-muted-foreground p-4">
            Nenhum boleto pendente encontrado.
          </p>
        )}
      </div>

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
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={pagamentoData.forma_pagamento}
                onChange={(e) =>
                  setPagamentoData({ ...pagamentoData, forma_pagamento: e.target.value })
                }
              >
                <option value="Pix">Pix</option>
                <option value="Transferência Bancária">Transferência Bancária</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
              </select>
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
