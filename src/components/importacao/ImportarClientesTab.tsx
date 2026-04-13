import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ImportPreviewParceirosTable, type RowDataParceiro } from './ImportPreviewParceirosTable'
import { extrairDocumentoParceiroIA, processarImportacao } from '@/services/importacao'
import { getParceiros } from '@/services/parceiros_negocios'

export default function ImportarClientesTab() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rows, setRows] = useState<RowDataParceiro[]>([])
  const [existingDocs, setExistingDocs] = useState<Set<string>>(new Set())
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getParceiros()
      .then((data) => {
        const docs = new Set(data.map((p) => p.numero_documento).filter(Boolean))
        setExistingDocs(docs)
      })
      .catch(console.error)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  const parseCSV = (text: string): RowDataParceiro[] => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim())

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const obj: any = {}
      headers.forEach((h, i) => {
        obj[h] = values[i] || ''
      })

      const row: RowDataParceiro = {
        nome_razao_social: obj.nome_razao_social || '',
        tipo_documento: obj.tipo_documento || '',
        numero_documento: obj.numero_documento || '',
        contato_whatsapp_cobranca: obj.contato_whatsapp_cobranca || '',
        email_cobranca: obj.email_cobranca || '',
        categoria_parceiro: obj.categoria_parceiro || 'Cliente',
        status: obj.status || 'Ativo',
        status_linha: 'Valid',
        errors: [],
        warnings: [],
      }
      return validateRow(row, 'CSV')
    })
  }

  const validateRow = (row: RowDataParceiro, origin: string): RowDataParceiro => {
    const errors: string[] = []

    if (!row.nome_razao_social) errors.push('Nome/Razão Social obrigatório')
    if (!row.numero_documento) errors.push('Documento obrigatório')

    if (existingDocs.has(row.numero_documento)) {
      errors.push('Documento já cadastrado')
    }

    row.origem_importacao = origin

    return {
      ...row,
      status_linha: errors.length > 0 ? 'Error' : 'Valid',
      errors,
    }
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsProcessing(true)
    setImportResult(null)

    try {
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text()
        const parsedRows = parseCSV(text)

        const seen = new Set()
        parsedRows.forEach((r: RowDataParceiro) => {
          if (r.numero_documento && seen.has(r.numero_documento)) {
            r.errors.push('Documento duplicado na planilha')
            r.status_linha = 'Error'
          }
          seen.add(r.numero_documento)
        })

        setRows(parsedRows)
        setIsProcessing(false)
      } else {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1]
          try {
            const res = await extrairDocumentoParceiroIA(
              base64,
              selectedFile.type || 'application/pdf',
            )
            const extracted = (res.data || []).map((row: any) =>
              validateRow(
                {
                  ...row,
                  status_linha: 'Valid',
                  errors: [],
                  warnings: [],
                },
                selectedFile.name.endsWith('.pdf') ? 'PDF' : 'Excel',
              ),
            )

            const seen = new Set()
            extracted.forEach((r: RowDataParceiro) => {
              if (r.numero_documento && seen.has(r.numero_documento)) {
                r.errors.push('Documento duplicado')
                r.status_linha = 'Error'
              }
              seen.add(r.numero_documento)
            })

            setRows(extracted)
          } catch (err) {
            console.error(err)
            setRows([])
          } finally {
            setIsProcessing(false)
          }
        }
        reader.readAsDataURL(selectedFile)
        return
      }
    } catch (e) {
      console.error(e)
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.status_linha === 'Valid')
    if (validRows.length === 0) return

    setIsProcessing(true)
    try {
      const res = await processarImportacao(
        'parceiros',
        validRows,
        file?.name || 'import.csv',
        'apenas_validos',
      )
      setImportResult({
        success: res.inseridos || 0,
        error: (res.erros?.length || 0) + rows.filter((r) => r.status_linha === 'Error').length,
      })
      const newDocs = new Set(existingDocs)
      validRows.forEach((r) => newDocs.add(r.numero_documento))
      setExistingDocs(newDocs)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const headers =
      'nome_razao_social,tipo_documento,numero_documento,contato_whatsapp_cobranca,email_cobranca,categoria_parceiro,status\n'
    const example = 'João Silva,CPF,12345678900,11999999999,joao@email.com,Pessoa Física,Ativo\n'
    const blob = new Blob([headers + example], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao_clientes.csv'
    a.click()
  }

  const reset = () => {
    setFile(null)
    setRows([])
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Card className="border-t-4 border-t-[#094016] shadow-md">
      <CardHeader>
        <CardTitle>Importador de Parceiros e Clientes</CardTitle>
        <CardDescription>
          Envie sua planilha (Excel/CSV) ou PDF para cadastrar clientes, fornecedores e parceiros em
          lote.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!file && (
          <div
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
              isDragging
                ? 'border-[#094016] bg-[#094016]/5 scale-[1.02]'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFile(e.dataTransfer.files[0])
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`h-12 w-12 mb-4 transition-colors ${isDragging ? 'text-[#094016]' : 'text-slate-400'}`}
            />
            <h3 className="text-lg font-medium text-slate-900">
              Arraste seu arquivo aqui ou clique para selecionar
            </h3>
            <p className="text-sm text-slate-500 mb-6 mt-1">
              Formatos suportados: .xlsx, .xls, .csv e .pdf
            </p>
            <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Baixar Modelo CSV
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.pdf,.xlsx,.xls"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center p-16 animate-fade-in">
            <RefreshCw className="h-10 w-10 text-[#094016] animate-spin mb-4" />
            <h3 className="text-lg font-medium">Processando documento...</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Extraindo e validando registros, por favor aguarde.
            </p>
          </div>
        )}

        {!isProcessing && file && !importResult && (
          <div className="space-y-6 animate-fade-in-up">
            <Alert className="bg-slate-50">
              <FileText className="h-4 w-4 text-[#094016]" />
              <AlertTitle className="text-[#094016]">Arquivo carregado: {file.name}</AlertTitle>
              <AlertDescription>
                Foram identificados <span className="font-semibold">{rows.length}</span> registros.
                Sendo{' '}
                <span className="font-semibold text-emerald-600">
                  {rows.filter((r) => r.status_linha === 'Valid').length} válidos
                </span>{' '}
                e{' '}
                <span className="font-semibold text-rose-600">
                  {rows.filter((r) => r.status_linha === 'Error').length} com erros
                </span>
                .
              </AlertDescription>
            </Alert>

            <ImportPreviewParceirosTable rows={rows} />
          </div>
        )}

        {importResult && (
          <Alert className="bg-emerald-50 border-emerald-200 animate-fade-in-up mt-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-800 text-lg">
              Importação Concluída com Sucesso!
            </AlertTitle>
            <AlertDescription className="text-emerald-700 mt-2 text-base">
              <strong>{importResult.success}</strong> clientes importados e salvos no sistema.
              <br />
              {importResult.error > 0 && (
                <span className="text-rose-600">
                  {importResult.error} registros não foram importados devido a erros.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {file && !isProcessing && (
        <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50 rounded-b-xl">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reimportar
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={rows.filter((r) => r.status_linha === 'Valid').length === 0}
              className="bg-[#094016] hover:bg-[#094016]/90 text-white px-8"
            >
              Confirmar Importação
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
