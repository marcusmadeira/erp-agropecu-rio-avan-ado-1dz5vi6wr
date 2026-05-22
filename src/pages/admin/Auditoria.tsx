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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Auditoria do Sistema</h1>
        <p className="text-slate-500 mt-1">Registro contínuo de todas as ações e eventos do ERP.</p>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Módulo / Tabela</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const isDelete =
                log.tipo_acao.toUpperCase().includes('DELETE') ||
                log.tipo_acao.toUpperCase().includes('EXCLUSÃO')
              const isCreate =
                log.tipo_acao.toUpperCase().includes('CREATE') ||
                log.tipo_acao.toUpperCase().includes('CRIAÇÃO')
              return (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {log.expand?.usuario_id?.name || log.user_email || 'Sistema Automático'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                        isDelete
                          ? 'bg-red-100 text-red-700'
                          : isCreate
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.tipo_acao}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 font-mono">
                    {log.tabela_afetada || 'Geral'}
                  </TableCell>
                </TableRow>
              )
            })}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
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
