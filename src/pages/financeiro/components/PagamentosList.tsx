import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getPagamentosRealizados, deletePagamentoRealizado } from '@/services/pagamentos_realizados'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function PagamentosList() {
  const [pagamentos, setPagamentos] = useState<any[]>([])

  const load = async () => {
    try {
      const data = await getPagamentosRealizados()
      setPagamentos(data)
    } catch (e) {
      toast.error('Erro ao carregar pagamentos')
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('pagamentos_realizados', load)

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro de pagamento?')) return
    try {
      await deletePagamentoRealizado(id)
      toast.success('Excluído com sucesso')
    } catch (e) {
      toast.error('Erro ao excluir')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos Realizados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Boleto Ref.</TableHead>
              <TableHead>Valor Pago</TableHead>
              <TableHead>Forma Pag.</TableHead>
              <TableHead>Comprovante</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{new Date(p.data_pagamento).toLocaleDateString()}</TableCell>
                <TableCell>{p.expand?.boleto_pagar_id?.numero_boleto || 'N/A'}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    p.valor_pago,
                  )}
                </TableCell>
                <TableCell>{p.forma_pagamento}</TableCell>
                <TableCell>
                  {p.comprovante_url && (
                    <a
                      href={pb.files.getUrl(p, p.comprovante_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pagamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
