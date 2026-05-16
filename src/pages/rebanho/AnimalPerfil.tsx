import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAnimal, getRentabilidadeAnimal } from '@/services/animais'
import { getHistoricoPesagem } from '@/services/pesagens'
import { createAuditoria } from '@/services/auditoria'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimalHeader } from '@/components/animais/AnimalHeader'
import { AnimalTimeline } from '@/components/animais/AnimalTimeline'
import { AnimalGenetica } from '@/components/animais/AnimalGenetica'
import { AnimalSanitario } from '@/components/animais/AnimalSanitario'
import { AnimalFinanceiro } from '@/components/animais/AnimalFinanceiro'
import { AnimalKPIs } from '@/components/animais/AnimalKPIs'
import { AnimalHistory } from '@/components/animais/AnimalHistory'
import { AnimalReproducao } from '@/components/animais/AnimalReproducao'
import { AnimalReclassificacao } from '@/components/animais/AnimalReclassificacao'
import AnimalForm from '@/pages/cadastros/AnimalForm'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export default function AnimalPerfil() {
  const { id } = useParams()
  const [animal, setAnimal] = useState<any>(null)
  const [pesagens, setPesagens] = useState<any[]>([])
  const [rentabilidade, setRentabilidade] = useState<any>(null)
  const [saleItem, setSaleItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const [aData, pData, rData] = await Promise.all([
        getAnimal(id, { expand: 'lote_atual_id,piquete_atual_id,pai_id,mae_id' }),
        getHistoricoPesagem(id),
        getRentabilidadeAnimal(id).catch(() => null),
      ])
      setAnimal(aData)
      setPesagens(pData)
      setRentabilidade(rData)

      if (aData.status === 'Vendido') {
        const vendas = await pb.collection('itens_venda').getFullList({
          filter: `animal_id='${id}'`,
          expand: 'venda_id,venda_id.cliente_id',
          sort: '-created',
        })
        if (vendas.length > 0) setSaleItem(vendas[0])
      } else {
        setSaleItem(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (id && pb.authStore.record?.id) {
      createAuditoria({
        usuario_id: pb.authStore.record.id,
        tipo_acao: 'READ',
        tabela_afetada: 'animais',
        registro_id: id,
        description: 'Visualização da ficha completa do animal',
      }).catch(() => {}) // Ignore audit errors to not break UX
    }
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
      <AnimalHeader animal={animal} pesagens={pesagens} onEdit={() => setFormOpen(true)} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Desempenho & Pesagens</TabsTrigger>
          {animal.sexo === 'Fêmea' && <TabsTrigger value="repro">Reprodução</TabsTrigger>}
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="reclass">Reclassificação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnimalTimeline animal={animal} pesagens={pesagens} />
            </div>
            <div className="space-y-6">
              <AnimalGenetica animal={animal} />
              <AnimalSanitario pesagens={pesagens} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <AnimalKPIs animal={animal} pesagens={pesagens} />
          <AnimalHistory pesagens={pesagens} animalId={animal.id} />
        </TabsContent>

        {animal.sexo === 'Fêmea' && (
          <TabsContent value="repro">
            <AnimalReproducao animalId={animal.id} />
          </TabsContent>
        )}

        <TabsContent value="finance">
          <AnimalFinanceiro rentabilidade={rentabilidade} saleItem={saleItem} />
        </TabsContent>

        <TabsContent value="reclass">
          <AnimalReclassificacao animal={animal} onReclassified={loadData} />
        </TabsContent>
      </Tabs>

      <AnimalForm open={formOpen} onOpenChange={setFormOpen} item={animal} onSaved={loadData} />
    </div>
  )
}
