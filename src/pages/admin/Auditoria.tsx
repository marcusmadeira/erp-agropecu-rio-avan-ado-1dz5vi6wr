import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

export default function Auditoria() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    pb.collection('auditoria_movimentacoes')
      .getList(1, 50, { sort: '-created', expand: 'usuario_id' })
      .then((res) => setLogs(res.items))
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Auditoria do Sistema</h1>
      <p className="text-slate-600">Registro contínuo de todas as ações e eventos de sistema.</p>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tabela / Contexto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">
                  {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{log.expand?.usuario_id?.name || log.user_email || 'Sistema'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${log.tipo_acao.includes('DELETE') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {log.tipo_acao}
                  </span>
                </TableCell>
                <TableCell>{log.tabela_afetada}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                  Nenhum log encontrado na base de dados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
