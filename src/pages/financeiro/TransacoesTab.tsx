import { useState, useEffect, useMemo } from 'react'
import {
  getTransacoesFinanceiras,
  deleteTransacaoFinanceira,
  TransacaoFinanceira,
} from '@/services/transacoes_financeiras'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { format, parseISO, isValid } from 'date-fns'
import { Edit, Trash2, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TransacaoFormModal } from './TransacaoFormModal'

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function TransacoesTab() {
  const [data, setData] = useState<TransacaoFinanceira[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState<string>('ALL')
  const [status, setStatus] = useState<string>('ALL')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TransacaoFinanceira | undefined>()

  const loadData = async () => {
    try {
      const items = await getTransacoesFinanceiras()
      setData(items)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('transacoes_financeiras', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteTransacaoFinanceira(id)
      toast({ title: 'Transação excluída com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        const matchSearch =
          item.descricao_lancamento.toLowerCase().includes(search.toLowerCase()) ||
          item.expand?.parceiro_id?.nome_razao_social?.toLowerCase().includes(search.toLowerCase())

        const matchTipo = tipo === 'ALL' || item.tipo_movimento === tipo
        const matchStatus = status === 'ALL' || item.status_pagamento === status

        const itemDate = item.data_vencimento ? new Date(item.data_vencimento).getTime() : 0
        const matchStart = dateStart ? itemDate >= new Date(dateStart).getTime() : true
        const matchEnd = dateEnd ? itemDate <= new Date(dateEnd).getTime() : true

        return matchSearch && matchTipo && matchStatus && matchStart && matchEnd
      })
      .sort((a, b) => {
        const d1 = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0
        const d2 = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0
        return d2 - d1
      })
  }, [data, search, tipo, status, dateStart, dateEnd])

  const safeDate = (d?: string) => {
    if (!d) return '-'
    try {
      const date = parseISO(d)
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '-'
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full md:w-auto flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-white"
            />
          </div>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value="Receita">Receita</SelectItem>
              <SelectItem value="Despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Recebido">Recebido</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="bg-white"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            title="Data Início"
          />
          <Input
            className="bg-white"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            title="Data Fim"
          />
        </div>

        <Button
          onClick={() => {
            setEditingItem(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Transação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Efetivação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>C. Custo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap font-medium text-xs">
                      {safeDate(item.data_competencia)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-xs">
                      {safeDate(item.data_vencimento)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-xs">
                      {safeDate(item.data_efetivacao_real)}
                    </TableCell>
                    <TableCell className="font-bold">{item.descricao_lancamento}</TableCell>
                    <TableCell className="text-xs">
                      {item.expand?.parceiro_id?.nome_razao_social || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          item.tipo_movimento === 'Receita'
                            ? 'text-emerald-600 font-bold'
                            : 'text-red-600 font-bold'
                        }
                      >
                        {item.tipo_movimento}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{item.centro_custo}</TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${item.tipo_movimento === 'Receita' ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {item.tipo_movimento === 'Receita' ? '+' : '-'}
                      {formatCurrency(item.valor_total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status_pagamento === 'Recebido'
                            ? 'default'
                            : item.status_pagamento === 'Atrasado'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {item.status_pagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem(item)
                            setFormOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A transação será removida
                                permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => item.id && handleDelete(item.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {formOpen && (
        <TransacaoFormModal open={formOpen} onOpenChange={setFormOpen} item={editingItem} />
      )}
    </div>
  )
}
