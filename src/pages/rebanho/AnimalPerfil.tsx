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
import AnimalForm from '@/pages/cadastros/AnimalForm'
import { useRealtime } from '@/hooks/use-realtime'

export default function AnimalPerfil() {
  const { id } = useParams()
  const [animal, setAnimal] = useState<any>(null)
  const [pesagens, setPesagens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const [aData, pData] = await Promise.all([
        getAnimal(id),
        getPesagens({ filter: `animal_id = "${id}"`, sort: 'data_pesagem' }),
      ])
      setAnimal(aData)
      setPesagens(pData)
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
        <TabsList className="mb-4">
          <TabsTrigger value="kpis">Rentabilidade & KPIs</TabsTrigger>
          <TabsTrigger value="history">Histórico de Pesagem</TabsTrigger>
          <TabsTrigger value="reclass">Reclassificação & Descarte</TabsTrigger>
        </TabsList>
        <TabsContent value="kpis">
          <AnimalKPIs animal={animal} pesagens={pesagens} />
        </TabsContent>
        <TabsContent value="history">
          <AnimalHistory pesagens={pesagens} animalId={animal.id} />
        </TabsContent>
        <TabsContent value="reclass">
          <AnimalReclassificacao animal={animal} onReclassified={loadData} />
        </TabsContent>
      </Tabs>

      <AnimalForm open={formOpen} onOpenChange={setFormOpen} item={animal} onSaved={loadData} />
    </div>
  )
}
