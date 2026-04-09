import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  getNotificacoes,
  markAsRead,
  clearAllNotificacoes,
  Notificacao,
} from '@/services/notificacoes'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, CheckCircle2, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
import { cn } from '@/lib/utils'

const TIPO_CORES: Record<string, string> = {
  'Estoque Crítico': 'bg-red-100 text-red-800',
  'Prenhez Confirmada': 'bg-green-100 text-green-800',
  'Pesagem Registrada': 'bg-blue-100 text-blue-800',
  'Transação Pendente': 'bg-yellow-100 text-yellow-800',
  'Erro Sistema': 'bg-slate-800 text-white',
}

export default function Notificacoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<string>('Todos')

  const loadData = async () => {
    if (!user) return
    try {
      setNotificacoes(await getNotificacoes())
    } catch (e) {
      toast({ title: 'Erro ao carregar notificações', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('notificacoes', loadData)

  const handleLido = async (id: string) => {
    try {
      await markAsRead(id)
      toast({ title: 'Notificação marcada como lida' })
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleLimpar = async () => {
    if (!user) return
    try {
      await clearAllNotificacoes(user.id)
      toast({ title: 'Notificações limpas' })
      setNotificacoes([])
    } catch {
      toast({ title: 'Erro ao limpar', variant: 'destructive' })
    }
  }

  const list = notificacoes.filter((n) => filtro === 'Todos' || n.tipo_alerta === filtro)

  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-[#1A237E]/10 flex items-center justify-center text-[#1A237E]">
            <Bell className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A237E]">Notificações</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os tipos</SelectItem>
              <SelectItem value="Estoque Crítico">Estoque Crítico</SelectItem>
              <SelectItem value="Prenhez Confirmada">Prenhez Confirmada</SelectItem>
              <SelectItem value="Pesagem Registrada">Pesagem Registrada</SelectItem>
              <SelectItem value="Transação Pendente">Transação Pendente</SelectItem>
              <SelectItem value="Erro Sistema">Erro Sistema</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Excluirá todo o histórico permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLimpar} className="bg-red-600 hover:bg-red-700">
                  Sim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[180px]">Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[150px]">Data</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhuma notificação encontrada.
                  </TableCell>
                </TableRow>
              )}
              {list.map((n) => (
                <TableRow
                  key={n.id}
                  className={cn(
                    'transition-colors',
                    n.lido ? 'bg-white text-slate-500' : 'bg-slate-50/50 font-medium',
                  )}
                >
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('font-normal', TIPO_CORES[n.tipo_alerta])}
                    >
                      {n.tipo_alerta}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn('max-w-md', !n.lido && 'text-slate-900')}>
                    {n.descricao}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(n.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {n.lido ? (
                      <span className="flex text-xs text-slate-500 items-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Lida
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-blue-600 font-semibold">
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
                        Não lida
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!n.lido && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLido(n.id)}
                        className="h-8 text-xs hover:text-[#1A237E]"
                      >
                        Ler
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
