import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Auditoria() {
  const { state } = useAppStore()
  const [search, setSearch] = useState('')

  if (state.userRole !== 1) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <ShieldCheck className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Esta área é restrita a administradores do sistema.
          </p>
        </div>
      </div>
    )
  }

  const filteredLogs = state.auditLogs
    .filter(
      (log) =>
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.table.toLowerCase().includes(search.toLowerCase()) ||
        log.recordId.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-900" />
          <h2 className="text-2xl font-bold text-emerald-900">Logs de Auditoria</h2>
        </div>
        <div className="flex items-center space-x-2 relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            className="pl-9 w-full sm:w-64"
            placeholder="Buscar usuário, tabela ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-subtle border-t-4 border-t-emerald-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela / Entidade</TableHead>
                <TableHead>ID Registro</TableHead>
                <TableHead>Modificação (De &rarr; Para)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {format(parseISO(log.date), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{log.userName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.action === 'Create'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'Update'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-600">{log.table}</TableCell>
                  <TableCell className="font-mono text-xs">{log.recordId}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    <span className="text-rose-600 line-through mr-2">{log.oldValue}</span>
                    <span className="text-emerald-600 font-bold">{log.newValue}</span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
