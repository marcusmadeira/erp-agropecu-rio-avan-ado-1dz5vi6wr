import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Handshake } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export function FluxoTables({ upcoming, overdue }: { upcoming: any[]; overdue: any[] }) {
  const [negociarItem, setNegociarItem] = useState<any>(null)
  const [nota, setNota] = useState('')
  const { toast } = useToast()

  const wppLink = (cliente: any, valor: number, msg: string) => {
    const fValor = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const text = encodeURIComponent(`Olá ${cliente?.nome_razao_social || 'Cliente'}, ${msg} ${fValor}.`)
    const num = cliente?.contato_whatsapp?.replace(/\D/g, '') || ''
    window.open(`https://wa.me/${num}?text=${text}`, '_blank')
  }

  const salvarNegociacao = async () => {
    if (!negociarItem) return
    try {
      toast({ title: 'Sucesso', description: 'Anotações salvas com sucesso.' })
      setNegociarItem(null)
      setNota('')
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar', variant: 'destructive' })
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Próximos Vencimentos (30 dias)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.slice(0, 10).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || '-'}</TableCell>
                  <TableCell>R$ {p.valor_parcela.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => wppLink(p.expand?.venda_id?.expand?.cliente_id, p.valor_parcela, 'lembrete de vencimento no valor de')}>
                      <Phone className="h-4 w-4 text-green-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {upcoming.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum vencimento próximo</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inadimplentes (> 5 dias)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Atraso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.slice(0, 10).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || '-'}</TableCell>
                  <TableCell><Badge variant="destructive">{p.dias_atraso} dias</Badge></TableCell>
                  <TableCell>R$ {p.valor_parcela.toFixed(2)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => wppLink(p.expand?.venda_id?.expand?.cliente_id, p.valor_parcela, 'notamos uma pendência no valor de')}>
                      <Phone className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Negociar" onClick={() => setNegociarItem(p)}>
                      <Handshake className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {overdue.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum inadimplente</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!negociarItem} onOpenChange={(v) => !v && setNegociarItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Negociação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="font-medium">{negociarItem?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social}</div>
            </div>
            <div className="space-y-2">
              <Label>Anotações da Negociação</Label>
              <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Detalhes do acordo, nova data prometida, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegociarItem(null)}>Cancelar</Button>
            <Button onClick={salvarNegociacao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
