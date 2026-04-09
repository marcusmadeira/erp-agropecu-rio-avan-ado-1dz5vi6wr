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
import { Card, CardContent } from '@/components/ui/card'
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
import { useAuth } from '@/hooks/use-auth'

export default function BoletosAtrasados({
  boletos,
  onRefresh,
}: {
  boletos: any[]
  onRefresh: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.nivel_acesso === 1
  const isManagerOrAdmin = user?.nivel_acesso === 1 || user?.nivel_acesso === 2

  const atrasados = boletos
    .filter(
      (b) =>
        b.status_boleto === 'Vencido' ||
        (b.status_boleto !== 'Pago' && new Date(b.data_vencimento) < new Date()),
    )
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())

  const [negoData, setNegoData] = useState({
    id: '',
    novo_vencimento: '',
    justificativa: '',
    desconto_juros: 0,
    parcelas: 1,
  })
  const [negoOpen, setNegoOpen] = useState(false)

  const handleWhatsApp = async (b: any, total: number) => {
    const cliente = b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
    const fone = cliente?.contato_whatsapp || ''
    const msg = `Olá, identificamos um atraso no boleto ${b.numero_boleto || 'N/D'}. O valor atualizado com juros/multa é ${formatCurrency(
      total,
    )}. Por favor, regularize ou entre em contato.\n\nLinha Digitável: ${b.codigo_barras || 'Não disponível'}\nLink do Boleto: ${b.url_boleto_pdf || 'Não disponível'}`
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
      <div className="hidden md:block">
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
                b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
                'N/D'
              const { diasAtraso, juros, multa, total } = calcularAtraso(
                b.data_vencimento,
                b.valor_boleto,
              )
              const isCritico = diasAtraso > 30
              const isWarning = diasAtraso > 7 && diasAtraso <= 30
              const isAttention = diasAtraso <= 7

              return (
                <TableRow
                  key={b.id}
                  className={cn({
                    'bg-red-50': isCritico,
                    'bg-orange-50': isWarning,
                    'bg-yellow-50': isAttention,
                  })}
                >
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
                    {isManagerOrAdmin && (
                      <Button
                        variant="ghost"
                        className="w-12 h-12"
                        onClick={() => handleWhatsApp(b, total)}
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          className="h-12"
                          onClick={() => {
                            setNegoData({
                              id: b.id,
                              novo_vencimento: '',
                              justificativa: '',
                              desconto_juros: 0,
                              parcelas: 1,
                            })
                            setNegoOpen(true)
                          }}
                        >
                          <Handshake className="w-5 h-5 mr-1" /> Negociar
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-12"
                          onClick={() => handleCancelar(b.id)}
                        >
                          <XCircle className="w-5 h-5 mr-1" /> Cancelar
                        </Button>
                      </>
                    )}
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {atrasados.map((b) => {
          const cliente =
            b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D'
          const { diasAtraso, juros, multa, total } = calcularAtraso(
            b.data_vencimento,
            b.valor_boleto,
          )
          const isCritico = diasAtraso > 30
          const isWarning = diasAtraso > 7 && diasAtraso <= 30
          const isAttention = diasAtraso <= 7

          return (
            <Card
              key={b.id}
              className={cn({
                'border-red-200 bg-red-50': isCritico,
                'border-orange-200 bg-orange-50': isWarning,
                'border-yellow-200 bg-yellow-50': isAttention,
              })}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{cliente}</h3>
                    <p className="text-sm text-muted-foreground">
                      Boleto: {b.numero_boleto || '-'}
                    </p>
                  </div>
                  <div className={cn('text-sm font-bold', { 'text-red-600': isCritico })}>
                    {diasAtraso} dias
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Original</p>
                    <p className="font-medium">{formatCurrency(b.valor_boleto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Juros/Multa</p>
                    <p className="font-medium text-red-600">{formatCurrency(juros + multa)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Atual</p>
                    <p className="font-bold text-lg">{formatCurrency(total)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {isManagerOrAdmin && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => handleWhatsApp(b, total)}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" /> Cobrar
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => {
                          setNegoData({
                            id: b.id,
                            novo_vencimento: '',
                            justificativa: '',
                            desconto_juros: 0,
                            parcelas: 1,
                          })
                          setNegoOpen(true)
                        }}
                      >
                        <Handshake className="w-5 h-5 mr-2" /> Negociar
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full h-12"
                        onClick={() => handleCancelar(b.id)}
                      >
                        <XCircle className="w-5 h-5 mr-2" /> Cancelar Boleto
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {atrasados.length === 0 && (
          <p className="text-center text-muted-foreground p-4">Nenhum boleto em atraso.</p>
        )}
      </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desconto nos Juros (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={negoData.desconto_juros}
                  onChange={(e) =>
                    setNegoData({ ...negoData, desconto_juros: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Qtd. Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={negoData.parcelas}
                  onChange={(e) => setNegoData({ ...negoData, parcelas: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Justificativa / Acordo (Obrigatório)</Label>
              <Textarea
                value={negoData.justificativa}
                onChange={(e) => setNegoData({ ...negoData, justificativa: e.target.value })}
                placeholder="Ex: Cliente pediu prorrogação..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRenegociar} disabled={!negoData.justificativa.trim()}>
              Confirmar Negociação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
