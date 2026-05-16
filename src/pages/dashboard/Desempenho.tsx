import { useEffect, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { RebanhoTab } from '@/components/desempenho/RebanhoTab'
import { EstoqueTab } from '@/components/desempenho/EstoqueTab'
import { ConsumoDesempenhoTab } from '@/components/desempenho/ConsumoDesempenhoTab'
import { useAuth } from '@/hooks/use-auth'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF, exportToExcel } from '@/lib/export'

export default function Desempenho() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('rebanho')
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

  const handleExportPDF = () => {
    if (activeTab === 'consumo') return
    if (activeTab === 'rebanho') {
      exportToPDF({
        title: 'Desempenho - Rebanho',
        data: animais,
        columns: [
          { header: 'Brinco', dataKey: 'id_manejo_brinco' },
          { header: 'Categoria', dataKey: 'categoria' },
          { header: 'Lote', dataKey: (r: any) => r.expand?.lote_atual?.nome_lote || '-' },
          { header: 'Peso Atual (kg)', dataKey: 'peso_atual_kg' },
        ],
        userName: user?.name || '',
      })
    } else {
      exportToPDF({
        title: 'Desempenho - Estoque',
        data: estoque,
        columns: [
          { header: 'Produto', dataKey: 'produto' },
          { header: 'Qtd Atual', dataKey: 'quantidade_atual' },
          { header: 'Unidade', dataKey: 'unidade_medida' },
        ],
        userName: user?.name || '',
      })
    }
  }

  const handleExportExcel = () => {
    if (activeTab === 'consumo') return
    if (activeTab === 'rebanho') {
      exportToExcel({
        title: 'Desempenho - Rebanho',
        data: animais,
        columns: [
          { header: 'Brinco', dataKey: 'id_manejo_brinco' },
          { header: 'Categoria', dataKey: 'categoria' },
          { header: 'Lote', dataKey: (r: any) => r.expand?.lote_atual?.nome_lote || '-' },
          { header: 'Peso Atual (kg)', dataKey: 'peso_atual_kg' },
        ],
        userName: user?.name || '',
      })
    } else {
      exportToExcel({
        title: 'Desempenho - Estoque',
        data: estoque,
        columns: [
          { header: 'Produto', dataKey: 'produto' },
          { header: 'Qtd Atual', dataKey: 'quantidade_atual' },
          { header: 'Unidade', dataKey: 'unidade_medida' },
        ],
        userName: user?.name || '',
      })
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in text-black">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Desempenho</h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real do Rebanho e Estoque.
          </p>
        </div>
        {activeTab !== 'consumo' && (
          <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border mb-4 flex flex-wrap h-auto">
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
          <TabsTrigger
            value="consumo"
            className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
          >
            Consumo vs Desempenho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rebanho">
          <RebanhoTab animais={animais} />
        </TabsContent>

        <TabsContent value="estoque">
          <EstoqueTab estoque={estoque} />
        </TabsContent>

        <TabsContent value="consumo">
          <ConsumoDesempenhoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
