import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Upload, CheckCircle2, FileText, Loader2, X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface FornecedorOCR {
  nome: string
  cnpj: string
}

interface ProdutoExtraido {
  nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  tipo: 'estoque' | 'despesa'
}

interface DadosExtraidos {
  fornecedor: FornecedorOCR
  nota_fiscal: string
  data: string
  data_vencimento?: string
  valor_total: number
  produtos: ProdutoExtraido[]
}

export default function ImportadorNotasFiscais() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [extractedData, setExtractedData] = useState<DadosExtraidos | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setExtractedData(null)
    } else {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive',
      })
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setIsExtracting(true)
    const formData = new FormData()
    formData.append('arquivo', file)

    try {
      const response = await pb.send('/backend/v1/extrair_nota_fiscal_ocr', {
        method: 'POST',
        body: formData,
      })
      setExtractedData(response)
      toast({
        title: 'Extração concluída',
        description:
          'Os dados foram extraídos com sucesso. Revise antes de confirmar a importação.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro na extração',
        description: error.message || 'Ocorreu um erro ao processar o arquivo PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirm = async () => {
    if (!extractedData || !user) return

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('dados', JSON.stringify(extractedData))
      if (file) {
        formData.append('arquivo', file)
      }

      await pb.send('/backend/v1/salvar_nota_fiscal_ocr', {
        method: 'POST',
        body: formData,
      })

      toast({
        title: 'Importação concluída',
        description: 'A nota fiscal foi processada e os registros foram criados com sucesso.',
      })
      setFile(null)
      setExtractedData(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao processar a nota fiscal.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in-up">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[#094016] font-['Montserrat']">
          Importador de Notas Fiscais
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Upload de PDF</CardTitle>
            <CardDescription>
              Faça o upload da nota fiscal em PDF para extração automática via OCR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-10 w-10 text-[#094016]" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para selecionar um arquivo PDF</p>
                  <p className="text-xs text-muted-foreground">ou arraste e solte aqui</p>
                </div>
              )}
            </div>

            {file && !extractedData && (
              <Button
                className="w-full bg-[#094016] hover:bg-[#094016]/90"
                onClick={handleExtract}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  'Extrair Dados'
                )}
              </Button>
            )}

            {file && extractedData && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFile(null)
                  setExtractedData(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar e Limpar
              </Button>
            )}
          </CardContent>
        </Card>

        {extractedData && (
          <Card className="col-span-4 lg:col-span-4 animate-fade-in-up">
            <CardHeader>
              <CardTitle>Dados Extraídos</CardTitle>
              <CardDescription>
                Revise os dados extraídos antes de confirmar a importação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <Label>Fornecedor</Label>
                  <Input value={extractedData.fornecedor.nome} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ</Label>
                  <Input value={extractedData.fornecedor.cnpj} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label>Número da Nota</Label>
                  <Input value={extractedData.nota_fiscal} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Data da Nota</Label>
                  <Input value={extractedData.data} readOnly type="date" className="bg-muted/50" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    value={extractedData.data_vencimento || ''}
                    readOnly
                    type="date"
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="rounded-md border mt-6 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">V. Unitário</TableHead>
                      <TableHead className="text-right">V. Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.produtos.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="capitalize text-slate-600">{p.tipo}</TableCell>
                        <TableCell className="text-right">{p.quantidade}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.valor_unitario)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.valor_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#094016] hover:bg-[#094016]/90"
                onClick={handleConfirm}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando movimentações...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
