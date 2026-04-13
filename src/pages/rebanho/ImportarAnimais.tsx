import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  UploadCloud,
  FileText,
  XCircle,
  BrainCircuit,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  extrairDocumentoIA,
  processarImportacaoAnimais,
  desfazerImportacao,
  getHistoricoImportacoes,
} from '@/services/importacao'
import { ImportPreviewTable, RowData } from '@/components/importacao/ImportPreviewTable'
import { ImportHistoryTable } from '@/components/importacao/ImportHistoryTable'
import { Progress } from '@/components/ui/progress'

export default function ImportarAnimais() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileOrigem, setFileOrigem] = useState<'CSV' | 'Excel' | 'PDF'>('CSV')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedRows, setParsedRows] = useState<RowData[]>([])

  const [history, setHistory] = useState<any[]>([])
  const [isUndoing, setIsUndoing] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    success: number
    errors: number
    logs: string[]
  } | null>(null)

  const [lotes, setLotes] = useState<any[]>([])

  useEffect(() => {
    loadReferenceData()
    loadHistory()
  }, [])

  const loadReferenceData = async () => {
    try {
      const res = await pb.collection('lotes').getFullList()
      setLotes(res)
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

  const handleDownloadTemplateCSV = () => {
    const headers =
      'id_manejo_brinco,rgd_rgn_abcz,categoria,status,peso_atual_kg,genealogia_pai,genealogia_mae,custo_variavel_acumulado,lote_atual_id,nome_lote\n'
    const sample = 'BR-001,PO-001,Matriz PO,Ativo,450,BR-PAI,BR-MAE,0,,Lote Padrão\n'
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'modelo_importacao_animais.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadTemplateExcel = () => {
    const table = `<table>
      <tr><th>id_manejo_brinco</th><th>rgd_rgn_abcz</th><th>categoria</th><th>status</th><th>peso_atual_kg</th><th>genealogia_pai</th><th>genealogia_mae</th><th>custo_variavel_acumulado</th><th>lote_atual_id</th><th>nome_lote</th></tr>
      <tr><td>BR-001</td><td>PO-001</td><td>Matriz PO</td><td>Ativo</td><td>450</td><td>BR-PAI</td><td>BR-MAE</td><td>0</td><td></td><td>Lote Padrão</td></tr>
    </table>`
    const uri = 'data:application/vnd.ms-excel;base64,'
    const template =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Template</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>{table}</body></html>'
    const base64 = function (s: string) {
      return window.btoa(unescape(encodeURIComponent(s)))
    }
    const format = function (s: string, c: any) {
      return s.replace(/{(\w+)}/g, function (m, p) {
        return c[p]
      })
    }
    const ctx = { worksheet: 'Template', table: table }
    const link = document.createElement('a')
    link.href = uri + base64(format(template, ctx))
    link.download = 'modelo_importacao_animais.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    let origem: 'CSV' | 'Excel' | 'PDF' = 'CSV'

    if (ext === 'pdf') origem = 'PDF'
    else if (['xls', 'xlsx'].includes(ext || '')) origem = 'Excel'
    else if (ext === 'csv') origem = 'CSV'
    else {
      toast({
        title: 'Formato inválido',
        description: 'Aceitos apenas PDF, Excel ou CSV.',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    setFileOrigem(origem)
    setImportResult(null)
    extractData(file, origem)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setParsedRows([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '') || ''
        if (encoded.length % 4 > 0) encoded += '='.repeat(4 - (encoded.length % 4))
        resolve(encoded)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const validateRows = (rows: any[]): RowData[] => {
    return rows.map((row) => {
      let status: 'Valid' | 'Warning' | 'Error' = 'Valid'
      let errors: string[] = []
      let warnings: string[] = []

      const brinco = row.id_manejo_brinco || row.brinco
      if (!brinco) {
        status = 'Error'
        errors.push('Brinco ausente')
      }

      let loteId = row.lote_atual_id ? row.lote_atual_id.toString().trim() : null
      const loteName = row.nome_lote || row.lote
      if (!loteId && loteName) {
        const loteObj = lotes.find(
          (l) => l.nome_lote?.toLowerCase() === String(loteName).toLowerCase(),
        )
        if (loteObj) loteId = loteObj.id
        else {
          status = 'Warning'
          warnings.push(`Lote '${loteName}' não encontrado, ficará sem lote`)
        }
      }

      if (status === 'Valid' && warnings.length > 0) status = 'Warning'

      return {
        id_manejo_brinco: brinco?.toString().trim() || '',
        rgd_rgn_abcz: (row.rgd_rgn_abcz || row.rgd || '').toString().trim(),
        categoria: row.categoria?.toString().trim() || 'Bezerro',
        status_animal: row.status?.toString().trim() || 'Ativo',
        peso_atual_kg: parseFloat(row.peso_atual_kg || row.peso) || 0,
        genealogia_pai: (row.genealogia_pai || row.pai || '').toString().trim(),
        genealogia_mae: (row.genealogia_mae || row.mae || '').toString().trim(),
        custo_variavel_acumulado: parseFloat(row.custo_variavel_acumulado || row.custo) || 0,
        lote_atual_id: loteId,
        nome_lote: loteName ? loteName.toString().trim() : '',
        status,
        errors,
        warnings,
      }
    })
  }

  const extractData = async (file: File, origem: 'CSV' | 'Excel' | 'PDF') => {
    setIsExtracting(true)
    setProgress(20)

    try {
      let extractedData: any[] = []

      if (origem === 'CSV') {
        const text = await file.text()
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l)
        if (lines.length > 1) {
          const headers = lines[0].split(/,|;/).map((h) => h.trim().toLowerCase())
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/,|;/)
            const row: any = {}
            headers.forEach((h, idx) => {
              row[h] = (values[idx] || '').trim()
            })
            extractedData.push(row)
          }
        }
        setProgress(100)
      } else {
        // PDF and Excel via AI Vision
        setProgress(50)
        const base64 = await getBase64(file)
        const res = await extrairDocumentoIA(base64, file.type || 'application/pdf')
        extractedData = res.data || []
        setProgress(100)
      }

      if (extractedData.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum dado válido encontrado no arquivo.',
          variant: 'destructive',
        })
      } else {
        const validated = validateRows(extractedData)
        setParsedRows(validated)
      }
    } catch (error: any) {
      toast({
        title: 'Erro na extração',
        description: error.message || 'Falha ao processar arquivo.',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.status !== 'Error')
    if (validRows.length === 0) return

    setIsImporting(true)
    try {
      const res = await processarImportacaoAnimais(validRows, fileOrigem)

      const clientErrors = parsedRows.filter((r) => r.status === 'Error')
      const totalErrors = res.errorCount + clientErrors.length
      const combinedLogs = [
        ...clientErrors.map(
          (r, i) =>
            `Validação Cliente: ${r.id_manejo_brinco || 'Linha ' + (i + 1)} - ${r.errors.join(', ')}`,
        ),
        ...res.errors,
      ]

      setImportResult({
        success: res.successCount,
        errors: totalErrors,
        logs: combinedLogs,
      })

      toast({
        title: res.successCount > 0 ? 'Concluído' : 'Aviso',
        description: `${res.successCount} animais importados com sucesso, ${totalErrors} com erro.`,
        className: res.successCount > 0 ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : '',
        variant: res.successCount === 0 && totalErrors > 0 ? 'destructive' : 'default',
      })

      if (res.successCount > 0) {
        loadHistory()
        loadReferenceData()
      }
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

  const validCount = parsedRows.filter((r) => r.status !== 'Error').length
  const errorCount = parsedRows.length - validCount

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#094016] rounded-xl text-white shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#094016] tracking-tight">
              Importador de Animais
            </h2>
            <p className="text-sm text-muted-foreground">
              Adicione registros em lote via CSV, Excel ou AI-PDF.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="nova" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="nova">Nova Importação</TabsTrigger>
          <TabsTrigger value="historico">Histórico e Rollback</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="space-y-6">
          <Card className="border-t-4 border-t-[#094016] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Envio de Arquivo</CardTitle>
                <CardDescription>
                  Formatos suportados: PDF, XLSX, XLS, CSV. Limite: 10MB.
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-[#094016] border-[#094016]/20"
                  >
                    <Download className="w-4 h-4" /> Baixar Modelo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadTemplateCSV}>
                    Baixar CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadTemplateExcel}>
                    Baixar Excel (.xls)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    accept=".pdf,.xls,.xlsx,.csv"
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
                        <p className="font-semibold text-sm flex items-center gap-2">
                          {selectedFile.name}
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                            {fileOrigem}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!isExtracting && !isImporting && !importResult && (
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
                    <div className="space-y-2 px-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#094016] flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {fileOrigem === 'PDF' || fileOrigem === 'Excel'
                            ? 'Processando com Inteligência Artificial...'
                            : 'Lendo arquivo...'}
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

          {parsedRows.length > 0 && !isExtracting && !importResult && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {(fileOrigem === 'PDF' || fileOrigem === 'Excel') && (
                <div className="bg-[#094016]/5 border border-[#094016]/20 rounded-md p-4 flex gap-3">
                  <BrainCircuit className="w-6 h-6 text-[#094016] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#094016]">Extração ADAPT Vision</h4>
                    <p className="text-sm text-[#094016]/80 mt-1">
                      A Inteligência Artificial extraiu {parsedRows.length} registros estruturados
                      do documento não estruturado. Revise os dados antes de prosseguir.
                    </p>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Pré-visualização</CardTitle>
                      <CardDescription>
                        {validCount} registros válidos e {errorCount} com erros. Apenas os válidos
                        serão importados.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleImport}
                      disabled={validCount === 0 || isImporting}
                      className="bg-[#094016] hover:bg-[#062b0f]"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importando...
                        </>
                      ) : (
                        'Confirmar Importação'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ImportPreviewTable rows={parsedRows} limit={5} />
                </CardContent>
              </Card>
            </div>
          )}

          {importResult && (
            <Card className="border-t-4 border-t-emerald-500 animate-in zoom-in-95 duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" /> Resumo da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{importResult.success}</p>
                    <p className="text-sm font-medium text-emerald-800">Animais Importados</p>
                  </div>
                  <div
                    className={`p-4 rounded-lg border text-center ${importResult.errors > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <p
                      className={`text-3xl font-bold ${importResult.errors > 0 ? 'text-rose-600' : 'text-slate-600'}`}
                    >
                      {importResult.errors}
                    </p>
                    <p
                      className={`text-sm font-medium ${importResult.errors > 0 ? 'text-rose-800' : 'text-slate-800'}`}
                    >
                      Com Erro
                    </p>
                  </div>
                </div>
                {importResult.logs.length > 0 && (
                  <div className="bg-rose-50 rounded-md p-3 border border-rose-100 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-rose-800 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Logs de Erro:
                    </p>
                    <ul className="text-xs text-rose-700 space-y-1 list-disc pl-4">
                      {importResult.logs.map((log, i) => (
                        <li key={i}>{log}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 flex justify-end rounded-b-xl border-t p-4">
                <Button onClick={clearSelection} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Reimportar / Novo Arquivo
                </Button>
              </CardFooter>
            </Card>
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
