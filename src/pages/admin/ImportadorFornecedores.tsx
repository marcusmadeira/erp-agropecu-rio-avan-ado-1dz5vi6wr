import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { extrairDocumentoParceiroIA } from '@/services/importacao'
import {
  ImportPreviewParceirosTable,
  type RowDataParceiro,
} from '@/components/importacao/ImportPreviewParceirosTable'
import pb from '@/lib/pocketbase/client'

export default function ImportadorFornecedores() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<RowDataParceiro[]>([])
  const [stats, setStats] = useState<{ success: number; error: number } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const downloadTemplate = () => {
    const csv =
      'nome_razao_social,tipo_documento,numero_documento,contato_whatsapp,email,categoria_fornecedor,status\nFornecedor Exemplo,CNPJ,12.345.678/0001-90,11999999999,contato@exemplo.com,Ração,Ativo'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_fornecedores.csv'
    a.click()
  }

  const parseCSV = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length < 2) return []
    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))
    return lines.slice(1).map((line) => {
      const values = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ''))
      const obj: any = {}
      headers.forEach((h, i) => {
        obj[h] = values[i] || ''
      })
      return obj
    })
  }

  const validateAndPreview = async (rawData: any[], origem: string) => {
    try {
      const existing = await pb
        .collection('parceiros_negocios')
        .getFullList({ fields: 'numero_documento' })
      const existingSet = new Set(
        existing.map((d) => (d.numero_documento || '').replace(/\D/g, '')).filter(Boolean),
      )

      const mapped: RowDataParceiro[] = rawData.map((raw) => {
        const nome = raw.nome_razao_social || raw.nome || raw.razao_social || ''
        const doc = raw.numero_documento || ''
        const tipo = raw.tipo_documento || (doc.length > 14 ? 'CNPJ' : 'CPF')
        const whats = raw.contato_whatsapp || raw.contato_whatsapp_cobranca || raw.telefone || ''
        const email = raw.email || raw.email_cobranca || ''
        const cat = raw.categoria_fornecedor || raw.categoria_parceiro || 'Outro'

        const errors: string[] = []
        if (!nome) errors.push('Nome obrigatório')
        if (!doc) errors.push('Documento obrigatório')

        const docClean = doc.replace(/\D/g, '')
        const isUpdate = docClean && existingSet.has(docClean)
        const warnings: string[] = []
        if (isUpdate) warnings.push('Documento já cadastrado (será atualizado)')

        return {
          nome_razao_social: nome,
          tipo_documento: tipo,
          numero_documento: doc,
          contato_whatsapp_cobranca: whats,
          email_cobranca: email,
          categoria_parceiro: cat,
          status: raw.status || 'Ativo',
          origem_importacao: origem,
          status_linha: errors.length > 0 ? 'Error' : warnings.length > 0 ? 'Warning' : 'Valid',
          errors,
          warnings,
        }
      })
      setPreviewData(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFile = async (f: File) => {
    setFile(f)
    setIsProcessing(true)
    setStats(null)
    setPreviewData([])
    const isCSV = f.name.endsWith('.csv')
    const isPDF = f.name.endsWith('.pdf')
    const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls')

    try {
      if (isCSV) {
        const text = await f.text()
        await validateAndPreview(parseCSV(text), 'CSV')
      } else if (isPDF || isExcel) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const result = e.target?.result
            if (typeof result !== 'string') throw new Error('Falha ao ler o arquivo')
            const base64 = result.split(',')[1]
            const res = await extrairDocumentoParceiroIA(base64, f.type)
            if (res.data && res.data.length > 0)
              await validateAndPreview(res.data, isPDF ? 'PDF' : 'Excel')
            else throw new Error('Nenhum dado extraído')
          } catch (err: any) {
            toast({ title: 'Erro', description: err.message, variant: 'destructive' })
            setIsProcessing(false)
          }
        }
        reader.readAsDataURL(f)
      } else {
        toast({ title: 'Formato não suportado', variant: 'destructive' })
        setIsProcessing(false)
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      setIsProcessing(false)
    }
  }

  const confirmImport = async () => {
    setIsProcessing(true)
    const valid = previewData.filter(
      (r) => r.status_linha === 'Valid' || r.status_linha === 'Warning',
    )

    try {
      const res = await pb.send('/backend/v1/processar-importacao', {
        method: 'POST',
        body: JSON.stringify({
          tipo_dado: 'parceiros',
          registros: valid,
          arquivo_nome: file?.name || 'fornecedores.csv',
          estrategia: 'apenas_validos',
        }),
      })

      setStats({ success: res.inseridos || 0, error: res.erros?.length || 0 })
      toast({
        title: 'Importação finalizada',
        description: `${res.inseridos} importados/atualizados, ${res.erros?.length || 0} falhas.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreviewData([])
    setStats(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#094016]/10 rounded-full">
            <UploadCloud className="w-8 h-8 text-[#094016]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#094016] tracking-tight">
              Importador de Fornecedores
            </h2>
            <p className="text-sm text-muted-foreground">
              Importe parceiros em massa via CSV, Excel ou PDF (IA).
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="border-[#094016] text-[#094016]"
        >
          <Download className="w-4 h-4 mr-2" /> Baixar Modelo
        </Button>
      </div>

      {!file && !stats && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${dragActive ? 'border-[#094016] bg-[#094016]/5' : 'border-slate-300 hover:bg-slate-50'}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <FileSpreadsheet className="w-12 h-12 text-[#094016]/40 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Arraste e solte seu arquivo aqui</p>
          <p className="text-sm text-muted-foreground mt-2">
            Suporta .CSV, .XLSX, .XLS ou Notas em .PDF
          </p>
        </div>
      )}

      {isProcessing && !stats && (
        <Card>
          <CardContent className="p-10 flex flex-col items-center justify-center">
            <RefreshCw className="w-10 h-10 text-[#094016] animate-spin mb-4" />
            <p className="text-lg font-medium text-slate-700">Processando arquivo...</p>
          </CardContent>
        </Card>
      )}

      {file && previewData.length > 0 && !stats && !isProcessing && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <Card className="shadow-sm bg-slate-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#094016]" />
                <div>
                  <p className="text-sm font-bold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {previewData.length} registros identificados
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
          <ImportPreviewParceirosTable rows={previewData} limit={5} />
          <div className="flex gap-4">
            <Button variant="outline" className="w-full" onClick={reset}>
              Cancelar
            </Button>
            <Button
              className="w-full bg-[#094016] hover:bg-[#094016]/90"
              onClick={confirmImport}
              disabled={
                !previewData.some((r) => r.status_linha === 'Valid' || r.status_linha === 'Warning')
              }
            >
              Confirmar Importação (
              {
                previewData.filter(
                  (r) => r.status_linha === 'Valid' || r.status_linha === 'Warning',
                ).length
              }{' '}
              registros)
            </Button>
          </div>
        </div>
      )}

      {stats && (
        <Card className="border-t-4 border-t-[#094016] animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Resumo da Importação</h3>
              <div className="mt-4 flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.success}</p>
                  <p className="text-sm text-slate-500">Sucessos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-rose-500">{stats.error}</p>
                  <p className="text-sm text-slate-500">Erros</p>
                </div>
              </div>
            </div>
            <Button onClick={reset} variant="outline" className="mt-4">
              Importar outro arquivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
