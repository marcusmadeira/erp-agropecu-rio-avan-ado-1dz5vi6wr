import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { getRegistrosNascimento } from '@/services/maternidade'
import { DialogRegistroParto } from './FormRegistroParto'
import { useRealtime } from '@/hooks/use-realtime'

export function MaternidadeNascimentos() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const loadData = async () => {
    try {
      const res = await getRegistrosNascimento()
      setData(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('nascimentos_e_desmama', loadData)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#094016]">Registros de Nascimento</h2>
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#094016] hover:bg-[#094016]/90 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Nascimento
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Matriz Mãe</TableHead>
              <TableHead>RGN / Brinco</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Peso (kg)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.data_nascimento
                    ? format(new Date(item.data_nascimento.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="font-bold text-[#094016]">
                  {item.expand?.matriz_mae_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>{item.rgn_provisorio_abcz || '-'}</TableCell>
                <TableCell>{item.sexo || '-'}</TableCell>
                <TableCell>{item.peso_nascer || '-'}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhum nascimento registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DialogRegistroParto
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          setOpen(false)
          loadData()
        }}
      />
    </div>
  )
}
