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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BoletoForm from './BoletoForm'
import { deleteBoleto } from '@/services/financeiro_recebimentos'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Edit, Trash, Plus } from 'lucide-react'
import { formatCurrency } from './utils'

export default function ListagemBoletos({ boletos, onRefresh }: any) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [editingBoleto, setEditingBoleto] = useState<any>(null)
  const [formOpen, setFormOpen] = useState(false)
  const { toast } = useToast()

  const handleDeletar = async (id: string) => {
    if (confirm('Deseja excluir este boleto permanentemente?')) {
      try {
        await deleteBoleto(id)
        toast({ title: 'Boleto excluído' })
        onRefresh()
      } catch {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  const filtered = boletos.filter((b: any) => {
    if (statusFiltro !== 'Todos' && b.status_boleto !== statusFiltro) return false
    const cliente =
      b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social?.toLowerCase() ||
      ''
    const numero = b.numero_boleto?.toLowerCase() || ''
    const term = busca.toLowerCase()
    return cliente.includes(term) || numero.includes(term)
  })

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <Input
            placeholder="Buscar por cliente ou número..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Gerado">Gerado</SelectItem>
              <SelectItem value="Enviado">Enviado</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditingBoleto(null)
            setFormOpen(true)
          }}
          className="bg-[#094016] text-white hover:bg-[#094016]/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Boleto
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.numero_boleto || 'N/D'}</TableCell>
                <TableCell>
                  {b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
                    'N/D'}
                </TableCell>
                <TableCell>
                  {b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell>{formatCurrency(b.valor_boleto)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      b.status_boleto === 'Pago'
                        ? 'default'
                        : b.status_boleto === 'Vencido' || b.status_boleto === 'Atrasado'
                          ? 'destructive'
                          : 'outline'
                    }
                  >
                    {b.status_boleto}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingBoleto(b)
                      setFormOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletar(b.id)}>
                    <Trash className="w-4 h-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum boleto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BoletoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        boleto={editingBoleto}
        onSuccess={() => {
          setFormOpen(false)
          onRefresh()
        }}
      />
    </div>
  )
}
