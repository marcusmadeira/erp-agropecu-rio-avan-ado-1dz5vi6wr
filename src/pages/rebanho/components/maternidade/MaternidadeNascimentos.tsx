import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { getRegistrosNascimento, adicionarAoEstoque } from '@/services/maternidade'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Baby, CheckCircle, Hash } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DialogRegistroParto } from './FormRegistroParto'
import { ModalRGN } from './ModalRGN'

export function MaternidadeNascimentos() {
  const [data, setData] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [openForm, setOpenForm] = useState(false)
  const [selectedRGN, setSelectedRGN] = useState<any>(null)

  const loadData = async () => setData(await getRegistrosNascimento())

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('registro_nascimento', loadData)
  useRealtime('animais', loadData)

  const handleEstoque = async (item: any) => {
    try {
      await adicionarAoEstoque(item)
      toast({ title: 'Adicionado ao estoque de produção' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao adicionar ao estoque', variant: 'destructive' })
    }
  }

  const filtered =
    filterStatus === 'Todos' ? data : data.filter((d) => d.status_rgn === filterStatus)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Filtrar Status:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Aguardando RGN">Aguardando RGN</SelectItem>
              <SelectItem value="RGN Recebido">RGN Recebido</SelectItem>
              <SelectItem value="Pronto Estoque">Pronto Estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="bg-[#094016] hover:bg-[#094016]/90 text-white font-bold"
        >
          <Baby className="w-4 h-4 mr-2" /> Registrar Parto
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tatuagem/Bezerro</TableHead>
              <TableHead>Matriz (Mãe)</TableHead>
              <TableHead>Data Nascimento</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Status RGN</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-[#094016]">{item.numero_tatuagem}</TableCell>
                <TableCell className="font-medium text-slate-700">
                  {item.expand?.vaca_mae_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>
                  {item.data_nascimento
                    ? format(new Date(item.data_nascimento.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{item.sexo}</TableCell>
                <TableCell>{item.peso_nascer ? `${item.peso_nascer} kg` : '-'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status_rgn === 'Pronto Estoque'
                        ? 'bg-green-100 text-green-800'
                        : item.status_rgn === 'RGN Recebido'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.status_rgn}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {item.status_rgn === 'Aguardando RGN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRGN(item)}
                      className="text-xs"
                    >
                      <Hash className="w-3 h-3 mr-1" /> Registrar RGN
                    </Button>
                  )}
                  {item.status_rgn === 'RGN Recebido' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleEstoque(item)}
                      className="bg-[#094016] hover:bg-[#094016]/90 text-xs text-white"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Add Estoque
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum bezerro encontrado com este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DialogRegistroParto
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={() => {
          setOpenForm(false)
          loadData()
        }}
      />
      {selectedRGN && (
        <ModalRGN
          registro={selectedRGN}
          onClose={() => setSelectedRGN(null)}
          onSuccess={() => {
            setSelectedRGN(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
