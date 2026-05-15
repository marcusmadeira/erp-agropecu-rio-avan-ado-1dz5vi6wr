import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getDespesas, deleteDespesa } from '@/services/despesas'
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
import { Plus, Edit, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import DespesaFormDialog from './DespesaFormDialog'
import pb from '@/lib/pocketbase/client'

export default function DespesasList() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [boletos, setBoletos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const load = async () => {
    try {
      const data = await getDespesas()
      setDespesas(data)
      const bData = await pb.collection('boletos_pagar').getFullList()
      setBoletos(bData)
    } catch (e) {
      toast.error('Erro ao carregar despesas')
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('despesas', load)
  useRealtime('boletos_pagar', load)

  const handleDelete = async (id: string) => {
    const despesaBoletos = boletos.filter((b) => b.despesa_id === id)
    const hasPago = despesaBoletos.some((b) => b.status === 'Pago')

    if (hasPago) {
      if (
        !confirm(
          'ATENÇÃO: Existem parcelas PAGAS para esta despesa. Ao excluir, as parcelas serão canceladas/excluídas. Tem certeza que deseja prosseguir?',
        )
      )
        return
    } else {
      if (!confirm('Deseja excluir esta despesa?')) return
    }

    try {
      await deleteDespesa(id)
      toast.success('Excluída com sucesso')
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lista de Despesas</CardTitle>
        <Button onClick={openNew} className="bg-[#094016] text-white hover:bg-[#094016]/90">
          <Plus className="w-4 h-4 mr-2" /> Nova Despesa
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>C. Custo</TableHead>
              <TableHead>Anexo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((d) => {
              const relBoletos = boletos.filter((b) => b.despesa_id === d.id)
              const totalBoletos = relBoletos.length || d.quantidade_parcelas || 1
              const pagosBoletos = relBoletos.filter((b) => b.status === 'Pago').length
              return (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.data_despesa).toLocaleDateString()}</TableCell>
                  <TableCell>{d.expand?.fornecedor_id?.nome_razao_social || '-'}</TableCell>
                  <TableCell>{d.tipo_despesa}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      d.valor_total || d.valor,
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${pagosBoletos === totalBoletos ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                    >
                      {pagosBoletos} / {totalBoletos} pagas
                    </span>
                  </TableCell>
                  <TableCell>{d.centro_custo}</TableCell>
                  <TableCell>
                    {d.comprovante_url && (
                      <a
                        href={pb.files.getUrl(d, d.comprovante_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {despesas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Nenhuma despesa encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <DespesaFormDialog
        open={open}
        onOpenChange={setOpen}
        initialData={editing}
        onSuccess={load}
      />
    </Card>
  )
}
