import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getBoletosPagar, deleteBoletoPagar } from '@/services/boletos_pagar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import BoletoFormDialog from './BoletoFormDialog'
import PagamentoFormDialog from './PagamentoFormDialog'

export default function BoletosPagarList() {
  const [boletos, setBoletos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const [openPagamento, setOpenPagamento] = useState(false)
  const [payingBoleto, setPayingBoleto] = useState<any>(null)

  const load = async () => {
    try {
      const data = await getBoletosPagar()
      setBoletos(data)
    } catch (e) {
      toast.error('Erro ao carregar boletos')
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('boletos_pagar', load)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este boleto?')) return
    try {
      await deleteBoletoPagar(id)
      toast.success('Excluído com sucesso')
    } catch (e) {
      toast.error('Erro ao excluir')
    }
  }

  const openEdit = (d: any) => {
    setEditing(d)
    setOpen(true)
  }
  const openNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const openPay = (d: any) => {
    setPayingBoleto(d)
    setOpenPagamento(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contas a Pagar (Boletos)</CardTitle>
        <Button onClick={openNew} className="bg-[#094016] text-white hover:bg-[#094016]/90">
          <Plus className="w-4 h-4 mr-2" /> Novo Boleto
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Nº Boleto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boletos.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{new Date(b.data_vencimento).toLocaleDateString()}</TableCell>
                <TableCell>
                  {b.expand?.fornecedor_id?.nome_razao_social ||
                    b.expand?.despesa_id?.expand?.fornecedor_id?.nome_razao_social ||
                    '-'}
                </TableCell>
                <TableCell>{b.numero_boleto || '-'}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    b.valor,
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${b.status === 'Pago' ? 'bg-green-100 text-green-800' : b.status === 'Atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {b.status}
                  </span>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  {b.status !== 'Pago' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPay(b)}
                      className="text-[#094016] border-[#094016] hover:bg-[#094016] hover:text-white"
                    >
                      <DollarSign className="w-4 h-4 mr-1" /> Pagar
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {boletos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nenhum boleto encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <BoletoFormDialog open={open} onOpenChange={setOpen} initialData={editing} onSuccess={load} />
      {payingBoleto && (
        <PagamentoFormDialog
          open={openPagamento}
          onOpenChange={setOpenPagamento}
          boleto={payingBoleto}
          onSuccess={load}
        />
      )}
    </Card>
  )
}
