import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Undo2 } from 'lucide-react'

interface ImportHistoryTableProps {
  history: any[]
  onUndo: (id: string) => void
  isUndoing: string | null
}

export function ImportHistoryTable({ history, onUndo, isUndoing }: ImportHistoryTableProps) {
  return (
    <div className="border rounded-md mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Arquivo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhum histórico de importação encontrado.
              </TableCell>
            </TableRow>
          ) : (
            history.map((h) => {
              const isWithin24h =
                new Date().getTime() - new Date(h.created).getTime() < 24 * 60 * 60 * 1000
              const canUndo = h.status === 'Sucesso' && isWithin24h

              return (
                <TableRow key={h.id}>
                  <TableCell>
                    <div className="font-medium">
                      {format(parseISO(h.created), 'dd/MM/yyyy HH:mm')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(h.created), { addSuffix: true, locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{h.expand?.usuario_id?.name || 'Sistema'}</TableCell>
                  <TableCell className="font-mono text-xs">{h.arquivo_nome}</TableCell>
                  <TableCell className="capitalize">{h.tipo_de_dado || 'Animais'}</TableCell>
                  <TableCell>{h.quantidade}</TableCell>
                  <TableCell>
                    <Badge
                      variant={h.status === 'Sucesso' ? 'default' : 'destructive'}
                      className={h.status === 'Sucesso' ? 'bg-[#094016]' : ''}
                    >
                      {h.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canUndo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUndo(h.id)}
                        disabled={isUndoing === h.id}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        {isUndoing === h.id ? 'Desfazendo...' : 'Desfazer'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
