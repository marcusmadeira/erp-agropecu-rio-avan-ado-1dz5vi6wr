import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAnimal } from '@/services/animais'
import { getPesagens } from '@/services/pesagens'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimalKPIs } from '@/components/animais/AnimalKPIs'
import { AnimalReclassificacao } from '@/components/animais/AnimalReclassificacao'
import { AnimalHistory } from '@/components/animais/AnimalHistory'
import { AnimalReproducao } from '@/components/animais/AnimalReproducao'
import AnimalForm from '@/pages/cadastros/AnimalForm'
import { useRealtime } from '@/hooks/use-realtime'
import { getRentabilidadeAnimal } from '@/services/animais'
import { getHistoricoPesagem } from '@/services/pesagens'

export default function AnimalPerfil() {
  const { id } = useParams()
  const [animal, setAnimal] = useState<any>(null)
  const [pesagens, setPesagens] = useState<any[]>([])
  const [rentabilidade, setRentabilidade] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const [aData, pData, rData] = await Promise.all([
        getAnimal(id),
        getHistoricoPesagem(id),
        getRentabilidadeAnimal(id),
      ])
      setAnimal(aData)
      setPesagens(pData)
      setRentabilidade(rData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('pesagens_diarias', loadData)
  useRealtime('animais', loadData)

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Carregando ficha do animal...
      </div>
    )
  if (!animal)
    return <div className="p-8 text-center text-red-500 font-medium">Animal não encontrado.</div>

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/animais">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#094016] flex items-center gap-3">
              {animal.nome || `Brinco ${animal.id_manejo_brinco}`}
              <Badge variant="secondary" className="bg-[#094016]/10 text-[#094016]">
                {animal.categoria}
              </Badge>
              <Badge variant="outline" className="border-slate-300">
                {animal.status}
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-1">
              Brinco:{' '}
              <span className="font-semibold text-slate-700">
                {animal.id_manejo_brinco || 'N/A'}
              </span>{' '}
              | Lote Atual:{' '}
              <span className="font-semibold text-slate-700">
                {animal.expand?.lote_atual?.nome_lote || 'Nenhum'}
              </span>{' '}
              | Sexo: <span className="font-semibold text-slate-700">{animal.sexo || 'N/A'}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-[#094016] hover:bg-[#094016]/90 text-white"
        >
          <Edit className="w-4 h-4 mr-2" /> Editar Animal
        </Button>
      </div>

      <Tabs defaultValue="kpis" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="kpis">Rentabilidade & KPIs</TabsTrigger>
          <TabsTrigger value="history">Histórico de Pesagem</TabsTrigger>
          {animal.sexo === 'Fêmea' && (
            <TabsTrigger value="reproducao">Histórico Reprodutivo</TabsTrigger>
          )}
          <TabsTrigger value="reclass">Reclassificação & Descarte</TabsTrigger>
        </TabsList>
        <TabsContent value="kpis">
          {rentabilidade && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase">Custo Total</p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {rentabilidade.custo_total?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase">Receita Estimada</p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {rentabilidade.receita_estimada?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase">Lucro</p>
                <p
                  className={`text-2xl font-bold ${rentabilidade.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  R$ {rentabilidade.lucro?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase">ROI</p>
                <p
                  className={`text-2xl font-bold ${rentabilidade.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {rentabilidade.roi?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>
          )}
          <AnimalKPIs animal={animal} pesagens={pesagens} />
        </TabsContent>
        <TabsContent value="history">
          <AnimalHistory pesagens={pesagens} animalId={animal.id} />
        </TabsContent>
        {animal.sexo === 'Fêmea' && (
          <TabsContent value="reproducao">
            <AnimalReproducao animalId={animal.id} />
          </TabsContent>
        )}
        <TabsContent value="reclass">
          <AnimalReclassificacao animal={animal} onReclassified={loadData} />
        </TabsContent>
      </Tabs>

      <AnimalForm open={formOpen} onOpenChange={setFormOpen} item={animal} onSaved={loadData} />
    </div>
  )
}
