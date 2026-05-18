import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { UploadCloud, FileSpreadsheet, RefreshCw, Trash2, ArrowRight } from 'lucide-react'
import {
  processarImportacao,
  desfazerImportacao,
  getHistoricoImportacoes,
} from '@/services/importacao'
import { useRealtime } from '@/hooks/use-realtime'
import { ImportHistoryTable } from '@/components/importacao/ImportHistoryTable'

type DataType = 'animais' | 'parceiros' | 'transacoes' | ''

const systemFields = {
  animais: [
    { key: 'id_manejo_brinco', label: 'Brinco (Obrigatório)' },
    { key: 'nome', label: 'Nome' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'peso_atual_kg', label: 'Peso Atual (kg)' },
  ],
  parceiros: [
    { key: 'nome_razao_social', label: 'Nome/Razão Social (Obrigatório)' },
    { key: 'numero_documento', label: 'CPF/CNPJ (Obrigatório)' },
    { key: 'tipo_documento', label: 'Tipo (CPF ou CNPJ)' },
    { key: 'categoria_parceiro', label: 'Categoria' },
  ],
  transacoes: [
    { key: 'descricao_lancamento', label: 'Descrição (Obrigatória)' },
    { key: 'valor_total', label: 'Valor Total (Obrigatório)' },
    { key: 'tipo_movimento', label: 'Tipo Movimento' },
    { key: 'data_competencia', label: 'Data Competência' },
    { key: 'data_vencimento', label: 'Data Vencimento' },
    { key: 'status_pagamento', label: 'Status' },
    { key: 'parceiro_documento', label: 'CPF/CNPJ do Parceiro' },
  ],
}

export default function Importacao() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dataType, setDataType] = useState<DataType>('')
  const [strategy, setStrategy] = useState<'apenas_validos' | 'parar_falha'>('apenas_validos')
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const [isProcessing, setIsProcessing] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [isUndoing, setIsUndoing] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const loadHistory = async () => {
    try {
      const data = await getHistoricoImportacoes()
      setHistory(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useRealtime('historico_importacoes', () => {
    loadHistory()
  })

  const parseCSV = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return { headers: [], rows: [] }
    const separator = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ''))
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ''))
      const obj: Record<string, string> = {}
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || ''
      })
      rows.push(obj)
    }
    return { headers, rows }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo CSV.',
        variant: 'destructive',
      })
      return
    }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      setCsvHeaders(headers)
      setCsvRows(rows)

      const initialMap: Record<string, string> = {}
      if (dataType && systemFields[dataType]) {
        systemFields[dataType].forEach((f) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase().includes(f.key.toLowerCase()) ||
              h.toLowerCase().includes(f.label.split(' ')[0].toLowerCase()),
          )
          if (match) initialMap[f.key] = match
        })
      }
      setMapping(initialMap)
    }
    reader.readAsText(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setImportErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMappingChange = (sysKey: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [sysKey]: csvHeader }))
  }

  const processImport = async () => {
    if (!dataType || csvRows.length === 0 || !selectedFile) return
    setIsProcessing(true)

    const registros = csvRows.map((row) => {
      const mapped: Record<string, any> = {}
      Object.entries(mapping).forEach(([sysKey, csvHeader]) => {
        if (csvHeader && row[csvHeader]) {
          mapped[sysKey] = row[csvHeader]
        }
      })
      return mapped
    })

    try {
      const res = await processarImportacao(dataType, registros, selectedFile.name, strategy)

      if (res.erros && res.erros.length > 0) {
        setImportErrors(res.erros)
        toast({
          title: 'Importação com Avisos',
          description: `Inseridos: ${res.inseridos} registros. Erros: ${res.erros.length}. Verifique as falhas.`,
          variant: 'destructive',
        })
      } else {
        setImportErrors([])
        toast({
          title: 'Importação Concluída!',
          description: `Inseridos: ${res.inseridos} registros com sucesso.`,
        })
      }
      setSelectedFile(null)
      setCsvHeaders([])
      setCsvRows([])
      setMapping({})
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      toast({
        title: 'Falha na Importação',
        description: err.message || 'Ocorreu um erro no processamento.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUndo = async (id: string) => {
    setIsUndoing(id)
    try {
      await desfazerImportacao(id)
      toast({ title: 'Importação desfeita com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Falha ao desfazer', description: err.message, variant: 'destructive' })
    } finally {
      setIsUndoing(null)
    }
  }

  const isReadyToImport =
    selectedFile && dataType && Object.keys(mapping).length > 0 && !isProcessing

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#094016]/10 rounded-full">
          <UploadCloud className="w-8 h-8 text-[#094016]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#094016] tracking-tight">
            Central de Importação
          </h2>
          <p className="text-sm text-muted-foreground">
            Importação em massa de Animais, Parceiros e Transações com validação avançada.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-[#094016]">
            <CardHeader className="pb-3">
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Defina o que será importado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Módulo de Destino</label>
                <Select
                  value={dataType}
                  onValueChange={(v) => {
                    setDataType(v as DataType)
                    clearFile()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o módulo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="animais">Cadastro de Animais</SelectItem>
                    <SelectItem value="parceiros">Fornecedores/Clientes</SelectItem>
                    <SelectItem value="transacoes">Transações Financeiras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dataType && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Estratégia de Falha
                  </label>
                  <Select value={strategy} onValueChange={(v) => setStrategy(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apenas_validos">Ignorar Erros e Continuar</SelectItem>
                      <SelectItem value="parar_falha">Parar na Primeira Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {dataType && !selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-[#094016] bg-[#094016]/5'
                  : 'border-slate-300 hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <FileSpreadsheet className="w-10 h-10 text-[#094016]/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Arraste e solte o CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Ou clique para procurar</p>
            </div>
          )}

          {selectedFile && (
            <Card className="shadow-sm bg-slate-50 border-dashed">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileSpreadsheet className="w-8 h-8 text-[#094016]" />
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {csvRows.length} linhas detectadas
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full bg-[#094016] hover:bg-[#094016]/90 h-12 text-md shadow-md"
            disabled={!isReadyToImport}
            onClick={processImport}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Processando...
              </>
            ) : (
              'Iniciar Importação'
            )}
          </Button>

          {importErrors.length > 0 && (
            <Card className="shadow-sm border-t-4 border-t-rose-500 bg-rose-50 mt-4 animate-fade-in-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-rose-700 text-sm">
                  Falhas de Validação ({importErrors.length})
                </CardTitle>
                <CardDescription className="text-xs text-rose-600/80">
                  Essas linhas não foram processadas e possuem erros críticos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-rose-700 max-h-48 overflow-y-auto list-disc pl-4 space-y-1">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-8 space-y-6">
          {selectedFile && dataType && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Mapeamento de Colunas</CardTitle>
                <CardDescription>
                  Associe as colunas do seu arquivo aos campos do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {systemFields[dataType].map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center gap-4 bg-slate-50 p-2 rounded-md border"
                    >
                      <div className="w-1/2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#094016]"></div>
                        <span className="text-sm font-medium">{field.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="w-1/2">
                        <Select
                          value={mapping[field.key] || ''}
                          onValueChange={(v) =>
                            handleMappingChange(field.key, v === 'none' ? '' : v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Ignorar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-slate-400 italic">
                              Ignorar campo
                            </SelectItem>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedFile && csvRows.length > 0 && dataType && (
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-3">
                <CardTitle className="text-sm">Pré-visualização de Dados (Mapeados)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {systemFields[dataType]
                        .filter((f) => mapping[f.key])
                        .map((f) => (
                          <TableHead key={f.key} className="text-xs whitespace-nowrap">
                            {f.label}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.slice(0, 3).map((row, idx) => (
                      <TableRow key={idx}>
                        {systemFields[dataType]
                          .filter((f) => mapping[f.key])
                          .map((f) => (
                            <TableCell key={f.key} className="text-xs truncate max-w-[150px]">
                              {row[mapping[f.key]] || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Histórico de Importações</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ImportHistoryTable history={history} onUndo={handleUndo} isUndoing={isUndoing} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
