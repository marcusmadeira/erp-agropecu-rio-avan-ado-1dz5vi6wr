import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Scale } from 'lucide-react'
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getPesagens,
  createPesagem,
  updatePesagem,
  deletePesagem,
  PesagemDiaria,
} from '@/services/pesagens'
import { getAnimais } from '@/services/animais'
import PesagemTable from '@/components/pesagem/PesagemTable'
import PesagemForm from '@/components/pesagem/PesagemForm'
import PesagemChart from '@/components/pesagem/PesagemChart'

export default function Pesagem() {
  const { toast } = useToast()
  const [pesagens, setPesagens] = useState<PesagemDiaria[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [animalFilter, setAnimalFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PesagemDiaria | undefined>(undefined)

  const loadData = async () => {
    try {
      const [pData, aData] = await Promise.all([
        getPesagens({ expand: 'animal_id', sort: '-data_pesagem' }),
        getAnimais(),
      ])
      setPesagens(pData)
      setAnimais(aData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('pesagens_diarias', () => {
    loadData()
  })

  const filteredData = useMemo(() => {
    return pesagens.filter((p) => {
      if (animalFilter !== 'all' && p.animal_id !== animalFilter) return false
      if (dateFrom && dateTo) {
        const date = parseISO(p.data_pesagem)
        if (
          !isWithinInterval(date, {
            start: startOfDay(parseISO(dateFrom)),
            end: endOfDay(parseISO(dateTo)),
          })
        )
          return false
      }
      return true
    })
  }, [pesagens, animalFilter, dateFrom, dateTo])

  const handleSubmit = async (data: any) => {
    try {
      if (editingRecord) await updatePesagem(editingRecord.id, data)
      else await createPesagem(data)
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      setIsFormOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao salvar.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePesagem(id)
      toast({ title: 'Sucesso', description: 'Registro excluído com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' })
    }
  }

  const openNew = () => {
    setEditingRecord(undefined)
    setIsFormOpen(true)
  }
  const openEdit = (record: PesagemDiaria) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Carregando dados de pesagem...
      </div>
    )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2.5 rounded-lg shadow-sm">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Pesagem</h1>
        </div>
        <Button
          onClick={openNew}
          className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Pesagem
        </Button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/3 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filtrar por Animal
          </label>
          <Select value={animalFilter} onValueChange={setAnimalFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Animais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Animais</SelectItem>
              {animais.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.id_manejo_brinco}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-1/3 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Data Inicial
          </label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="w-full sm:w-1/3 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Data Final
          </label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <PesagemChart data={filteredData} animalFilter={animalFilter} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          Histórico de Pesagens
        </h2>
        <PesagemTable data={filteredData} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      <PesagemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingRecord}
        animais={animais}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
