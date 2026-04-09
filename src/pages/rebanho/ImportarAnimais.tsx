import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadCloud, FileText, XCircle, BrainCircuit, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { importarAnimais, desfazerImportacao, getHistoricoImportacoes } from '@/services/importacao'
import { ImportPreviewTable, RowData } from '@/components/importacao/ImportPreviewTable'
import { ImportHistoryTable } from '@/components/importacao/ImportHistoryTable'
import { Progress } from '@/components/ui/progress'

export default function ImportarAnimais() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedRows, setParsedRows] = useState<RowData[]>([])

  const [history, setHistory] = useState<any[]>([])
  const [isUndoing, setIsUndoing] = useState<string | null>(null)

  const [lotes, setLotes] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [adaptSummary, setAdaptSummary] = useState('')

  useEffect(() => {
    loadReferenceData()
    loadHistory()
  }, [])

  const loadReferenceData = async () => {
    try {
      const [lRes, aRes] = await Promise.all([
        pb.collection('lotes').getFullList(),
        pb.collection('animais').getFullList({ fields: 'id,id_manejo_brinco' }),
      ])
      setLotes(lRes)
      setAnimais(aRes)
    } catch (e) {
      console.error(e)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await getHistoricoImportacoes()
      setHistory(res)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileSelection(e.target.files[0])
    }
  }

  const processFileSelection = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Arquivo excede 10MB.', variant: 'destructive' })
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'xls', 'xlsx'].includes(ext || '')) {
      toast({
        title: 'Formato inválido',
        description: 'Aceitos apenas PDF ou Excel.',
        variant: 'destructive',
      })
      return
    }
    setSelectedFile(file)
    simulateAIExtraction(file)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setParsedRows([])
    setAdaptSummary('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validateRows = (rows: any[]): RowData[] => {
    return rows.map((row) => {
      let status: 'Valid' | 'Warning' | 'Error' = 'Valid'
      let errors: string[] = []
      let warnings: string[] = []

      if (!row.nome) {
        status = 'Error'
        errors.push('Nome ausente')
      }
      if (!row.brinco) {
        status = 'Error'
        errors.push('Brinco ausente')
      } else if (animais.some((a) => a.id_manejo_brinco === row.brinco)) {
        status = 'Error'
        errors.push('Brinco já existe')
      }

      const validCats = ['Matriz PO', 'Touro PO', 'Bezerro', 'Novilha TIP', 'Garrote TIP']
      if (!validCats.includes(row.categoria)) {
        status = 'Error'
        errors.push('Categoria inválida')
      }

      if (!row.data_nascimento) {
        status = 'Error'
        errors.push('Data Nasc. ausente')
      }

      const peso = parseFloat(row.peso)
      if (isNaN(peso) || peso <= 0) {
        status = 'Error'
        errors.push('Peso inválido')
      } else if (row.categoria === 'Bezerro' && peso > 300) {
        status = 'Warning'
        warnings.push('Peso anormal para Bezerro')
      }

      const loteObj = lotes.find((l) => l.nome_lote === row.lote)
      if (!loteObj) {
        status = 'Error'
        errors.push('Lote não encontrado')
      } else {
        row.lote_id = loteObj.id
      }

      if (row.pai && !animais.some((a) => a.id_manejo_brinco === row.pai)) {
        status = 'Warning'
        warnings.push('Pai não cadastrado')
      }

      if (status === 'Valid' && warnings.length > 0) status = 'Warning'

      return { ...row, status, errors, warnings }
    })
  }

  const simulateAIExtraction = (file: File) => {
    setIsExtracting(true)
    setProgress(0)

    const interval = setInterval(() => setProgress((p) => p + 10), 200)

    setTimeout(() => {
      clearInterval(interval)
      setIsExtracting(false)

      const loteName = lotes.length > 0 ? lotes[0].nome_lote : 'Lote Padrão'

      const mockData = [
        {
          nome: 'Nelore Alpha',
          brinco: `BR-${Math.floor(Math.random() * 10000)}`,
          rgd: 'PO-991',
          categoria: 'Touro PO',
          data_nascimento: '2020-05-10',
          peso: 850,
          pai: '',
          mae: '',
          lote: loteName,
        },
        {
          nome: 'Matriz Beta',
          brinco: `BR-${Math.floor(Math.random() * 10000)}`,
          rgd: 'PO-992',
          categoria: 'Matriz PO',
          data_nascimento: '2019-08-20',
          peso: 600,
          pai: '',
          mae: '',
          lote: loteName,
        },
        {
          nome: 'Bezerro Gama',
          brinco: `BR-${Math.floor(Math.random() * 10000)}`,
          rgd: '',
          categoria: 'Bezerro',
          data_nascimento: '2023-01-15',
          peso: 350,
          pai: '',
          mae: '',
          lote: loteName,
        },
        {
          nome: 'Fêmea Errada',
          brinco: `BR-${Math.floor(Math.random() * 10000)}`,
          rgd: '',
          categoria: 'Vaca',
          data_nascimento: '2020-01-01',
          peso: 500,
          pai: '',
          mae: '',
          lote: 'Lote Inexistente',
        },
      ]

      const validated = validateRows(mockData)
      setParsedRows(validated)

      const valids = validated.filter((r) => r.status !== 'Error').length
      setAdaptSummary(
        `ADAPT analisou o arquivo ${file.name}. Foram encontrados ${validated.length} registros, sendo ${valids} prontos para importação e ${validated.length - valids} com erros críticos. A sugestão é corrigir a categoria "Vaca" para "Matriz PO".`,
      )
    }, 2000)
  }

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.status !== 'Error')
    if (validRows.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum registro válido para importar.',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)
    try {
      await importarAnimais(selectedFile?.name || 'arquivo.pdf', validRows)
      toast({
        title: 'Sucesso',
        description: `${validRows.length} animais importados com sucesso.`,
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
      clearSelection()
      loadHistory()
      loadReferenceData()
    } catch (err: any) {
      toast({
        title: 'Falha na Importação',
        description: err.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleUndo = async (id: string) => {
    setIsUndoing(id)
    try {
      await desfazerImportacao(id)
      toast({ title: 'Desfeito', description: 'A importação foi desfeita com sucesso.' })
      loadHistory()
      loadReferenceData()
    } catch (err: any) {
      toast({ title: 'Erro ao desfazer', description: err.message, variant: 'destructive' })
    } finally {
      setIsUndoing(null)
    }
  }

  const hasValidRows = parsedRows.some((r) => r.status !== 'Error')

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <BrainCircuit className="w-8 h-8 text-[#094016]" />
        <div>
          <h2 className="text-2xl font-bold text-[#094016] tracking-tight">
            Importação com ADAPT AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Extraia dados de planilhas e PDFs com inteligência artificial.
          </p>
        </div>
      </div>

      <Tabs defaultValue="nova" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="nova">Nova Importação</TabsTrigger>
          <TabsTrigger value="historico">Histórico e Rollback</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <Card className="border-t-4 border-t-[#094016]">
            <CardHeader>
              <CardTitle>Envio de Arquivo</CardTitle>
              <CardDescription>Formatos suportados: PDF, XLSX, XLS. Limite: 10MB.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${dragActive ? 'border-[#094016] bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="w-12 h-12 text-[#094016]/40 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-slate-700">
                    Arraste e solte o arquivo aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou clique para selecionar no computador
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#094016]" />
                      <div>
                        <p className="font-semibold text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!isExtracting && !isImporting && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {isExtracting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#094016] flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" /> ADAPT está analisando o
                          arquivo...
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {parsedRows.length > 0 && !isExtracting && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#094016]/5 border border-[#094016]/20 rounded-md p-4 flex gap-3">
                <BrainCircuit className="w-6 h-6 text-[#094016] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#094016]">Análise ADAPT</h4>
                  <p className="text-sm text-[#094016]/80 mt-1">{adaptSummary}</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Pré-visualização da Importação</CardTitle>
                      <CardDescription>
                        Apenas registros com status Válido ou Aviso serão importados.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleImport}
                      disabled={!hasValidRows || isImporting}
                      className="bg-[#094016] hover:bg-[#062b0f]"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importando...
                        </>
                      ) : (
                        'Processar Arquivo'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ImportPreviewTable rows={parsedRows} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
              <CardDescription>
                Visualize o histórico e desfaça importações recentes (até 24h).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHistoryTable history={history} onUndo={handleUndo} isUndoing={isUndoing} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
