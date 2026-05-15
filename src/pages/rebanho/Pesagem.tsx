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
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import PesagemLoteForm from '@/components/pesagem/PesagemLoteForm'
import { createPesagemLote } from '@/services/pesagens'

export default function Pesagem() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pesagens, setPesagens] = useState<PesagemDiaria[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [animalFilter, setAnimalFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoteFormOpen, setIsLoteFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PesagemDiaria | undefined>(undefined)

  const loadData = async () => {
    try {
      const [pData, aData, lData] = await Promise.all([
        getPesagens({ expand: 'animal_id', sort: '-data_pesagem' }),
        getAnimais(),
        pb.collection('lotes').getFullList(),
      ])
      setPesagens(pData)
      setAnimais(aData)
      setLotes(lData)
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
        description: err.data?.message || err.message || 'Erro ao salvar.',
        variant: 'destructive',
      })
    }
  }

  const handleLoteSubmit = async (data: any) => {
    try {
      const res = await createPesagemLote(data)
      toast({
        title: 'Sucesso',
        description: `${res.animais_pesados} animais pesados com sucesso.`,
      })
      setIsLoteFormOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.data?.message || err.message || 'Erro ao salvar pesagem em lote.',
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

  const exportColumns = [
    { header: 'Animal', dataKey: (r: any) => r.expand?.animal_id?.id_manejo_brinco || '-' },
    {
      header: 'Data Pesagem',
      dataKey: (r: any) =>
        r.data_pesagem ? format(new Date(r.data_pesagem.replace(' ', 'T')), 'dd/MM/yyyy') : '-',
    },
    { header: 'Peso (kg)', dataKey: 'peso_kg' },
    { header: 'Responsável', dataKey: 'responsavel_pesagem' },
    { header: 'Observações', dataKey: 'observacoes' },
  ]

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
        <div className="flex gap-2">
          <Button
            onClick={() => setIsLoteFormOpen(true)}
            variant="outline"
            className="shadow-sm transition-all"
          >
            <Scale className="w-4 h-4 mr-2" /> Pesagem em Lote
          </Button>
          <Button
            onClick={openNew}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Pesagem
          </Button>
        </div>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            Histórico de Pesagens
          </h2>
          <ExportButtons
            onExportPDF={() =>
              exportToPDF({
                title: 'Histórico de Pesagens',
                data: filteredData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
            onExportExcel={() =>
              exportToExcel({
                title: 'Histórico de Pesagens',
                data: filteredData,
                columns: exportColumns,
                userName: user?.name || '',
              })
            }
          />
        </div>
        <PesagemTable data={filteredData} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      <PesagemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingRecord}
        animais={animais}
        onSubmit={handleSubmit}
      />

      <PesagemLoteForm
        isOpen={isLoteFormOpen}
        onClose={() => setIsLoteFormOpen(false)}
        lotes={lotes}
        onSubmit={handleLoteSubmit}
      />
    </div>
  )
}
