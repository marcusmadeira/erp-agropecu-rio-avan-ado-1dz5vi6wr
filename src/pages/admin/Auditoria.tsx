import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, Search, DownloadCloud } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Auditoria() {
  const { state } = useAppStore()
  const { toast } = useToast()
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

  const exportBackup = () => {
    const dataStr = JSON.stringify(state, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup_agro_erp_completo_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Backup Gerado!',
      description: 'O arquivo JSON completo da base de dados foi baixado no seu dispositivo.',
    })
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
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Config & Auditoria</h2>
            <p className="text-sm text-muted-foreground">Logs de segurança e infraestrutura</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-64"
              placeholder="Buscar log (tabela, user, ID)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={exportBackup}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0 shadow-sm"
          >
            <DownloadCloud className="w-4 h-4 mr-2" /> Backup DB
          </Button>
        </div>
      </div>

      <Card className="shadow-subtle border-t-4 border-t-emerald-700 mt-4">
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
