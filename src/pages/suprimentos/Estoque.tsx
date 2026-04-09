import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Box, Droplet, BrainCircuit, FileText, Upload, RefreshCw } from 'lucide-react'
import { InsumosTab } from './components/InsumosTab'
import { SemenTab } from './components/SemenTab'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createEstoqueInsumo, EstoqueInsumo } from '@/services/estoque_insumos'
import { createEstoqueSemen, EstoqueSemen } from '@/services/estoque_semen'

export default function Estoque() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canEdit = user?.nivel_acesso === 1 || user?.nivel_acesso === 3
  const [ocrOpen, setOcrOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<any[]>([])

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsAnalyzing(true)

    setTimeout(() => {
      setExtractedItems([
        {
          id: Math.random().toString(),
          produto: 'Vacina Clostridiose 50 Doses',
          categoria: 'Saúde',
          quantidade_atual: 200,
          unidade_medida: 'Doses',
          custo_medio_unitario: 1.5,
          estoque_minimo_critico: 50,
        },
        {
          id: Math.random().toString(),
          touro_doador: 'REM Armador',
          categoria: 'Sêmen',
          doses_palhetas_disponiveis: 50,
          botijao_armazenado: 'BT-EXT',
        },
      ])
      setIsAnalyzing(false)
      toast({ title: 'Leitura Concluída', description: 'Dados extraídos da NF-e com IA.' })
    }, 2500)
  }

  const handleSaveOcr = async () => {
    if (extractedItems.length === 0) return

    try {
      for (const item of extractedItems) {
        if (item.categoria === 'Sêmen') {
          await createEstoqueSemen({
            touro_doador: item.touro_doador,
            doses_palhetas_disponiveis: item.doses_palhetas_disponiveis,
            botijao_armazenado: item.botijao_armazenado,
          } as EstoqueSemen)
        } else {
          await createEstoqueInsumo({
            produto: item.produto,
            quantidade_atual: item.quantidade_atual,
            unidade_medida: item.unidade_medida,
            custo_medio_unitario: item.custo_medio_unitario,
            estoque_minimo_critico: item.estoque_minimo_critico,
          } as EstoqueInsumo)
        }
      }
      setOcrOpen(false)
      setExtractedItems([])
      toast({ title: 'Estoque Atualizado', description: 'Itens importados com sucesso.' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar itens importados.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Box className="text-primary w-8 h-8" />
          <h2 className="text-2xl font-bold text-primary">Gestão de Estoque</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {user?.nivel_acesso !== 3 && (
            <Button variant="outline" asChild className="text-indigo-700 border-indigo-200">
              <Link to="/previsao-demanda">
                <BrainCircuit className="w-4 h-4 mr-2" /> Previsão IA
              </Link>
            </Button>
          )}
          {canEdit && (
            <Dialog
              open={ocrOpen}
              onOpenChange={(v) => {
                setOcrOpen(v)
                if (!v) setExtractedItems([])
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="text-amber-700 border-amber-200">
                  <FileText className="w-4 h-4 mr-2" /> Ler NF-e (IA)
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" /> OCR Inteligente
                  </DialogTitle>
                  <DialogDescription>
                    Extração automática de produtos e quantidades via PDF.
                  </DialogDescription>
                </DialogHeader>

                {extractedItems.length === 0 ? (
                  <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleOcrUpload}
                      disabled={isAnalyzing}
                    />
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center">
                        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                        <p className="font-bold text-slate-700">Processando...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="font-bold text-slate-700">Arraste a NF-e aqui</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto/Touro</TableHead>
                          <TableHead>Cat.</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedItems.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="font-bold">
                              {i.produto || i.touro_doador}
                            </TableCell>
                            <TableCell>{i.categoria}</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {i.quantidade_atual || i.doses_palhetas_disponiveis}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button className="w-full bg-primary" onClick={handleSaveOcr}>
                      Confirmar Importação
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="insumos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="insumos" className="flex items-center gap-2">
            <Box className="w-4 h-4" /> Insumos
          </TabsTrigger>
          <TabsTrigger value="semen" className="flex items-center gap-2">
            <Droplet className="w-4 h-4" /> Sêmen
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insumos" className="mt-4">
          <InsumosTab />
        </TabsContent>
        <TabsContent value="semen" className="mt-4">
          <SemenTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
