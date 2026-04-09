import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { RebanhoTab } from '@/components/desempenho/RebanhoTab'
import { EstoqueTab } from '@/components/desempenho/EstoqueTab'

export default function Desempenho() {
  const [animais, setAnimais] = useState<any[]>([])
  const [estoque, setEstoque] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [animaisData, estoqueData] = await Promise.all([
        pb.collection('animais').getFullList({ expand: 'lote_atual', sort: '-created' }),
        pb.collection('estoque_insumos').getFullList({ sort: '-created' }),
      ])
      setAnimais(animaisData)
      setEstoque(estoqueData)
    } catch (error) {
      console.error('Error loading desempenho data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('animais', () => loadData())
  useRealtime('estoque_insumos', () => loadData())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f172a]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in text-black">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Desempenho</h2>
        <p className="text-sm text-muted-foreground">
          Monitoramento em tempo real do Rebanho e Estoque.
        </p>
      </div>

      <Tabs defaultValue="rebanho" className="w-full">
        <TabsList className="bg-white border mb-4">
          <TabsTrigger
            value="rebanho"
            className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
          >
            Rebanho
          </TabsTrigger>
          <TabsTrigger
            value="estoque"
            className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
          >
            Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rebanho">
          <RebanhoTab animais={animais} />
        </TabsContent>

        <TabsContent value="estoque">
          <EstoqueTab estoque={estoque} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
