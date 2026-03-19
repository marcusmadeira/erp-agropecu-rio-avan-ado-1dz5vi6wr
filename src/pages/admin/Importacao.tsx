import { useState, useRef } from 'react'
import useAppStore from '@/stores/useAppStore'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type DataType =
  | '1-Cadastro de Animais'
  | '2-Histórico de Pesagem'
  | '3-Eventos Reprodutivos'
  | '4-Financeiro'

export default function Importacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dataType, setDataType] = useState<DataType | ''>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file)
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, envie um arquivo CSV.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const parseCSV = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const obj: any = {}
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || ''
      })
      rows.push(obj)
    }
    return rows
  }

  const processImport = () => {
    if (!selectedFile || !dataType) return
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      const errors: string[] = []

      dispatch((s) => {
        const newState = { ...s }
        let successCount = 0

        // Routine 1: Animal Inventory
        if (dataType === '1-Cadastro de Animais') {
          rows.forEach((row, i) => {
            const brinco = row['Brinco']
            if (!brinco) {
              errors.push(`Linha ${i + 1}: Brinco vazio`)
              return
            }
            const animal = newState.animais.find(
              (a) => a.brinco === brinco || (a.rgn && a.rgn === row['RGD']),
            )
            const loteName = row['Lote_Atual']
            const loteId =
              newState.lotes.find((l) => l.name === loteName)?.id || newState.lotes[0]?.id || 'l1'

            if (animal) {
              animal.loteId = loteId
              animal.pesoAtual = Number(row['Peso_Atual']) || animal.pesoAtual
              animal.categoria = row['Categoria'] || animal.categoria
              successCount++
            } else {
              const newAnimal = {
                id: Math.random().toString(),
                brinco: brinco,
                rgn: row['RGD'] || '',
                loteId: loteId,
                categoria: row['Categoria'] || 'Bezerro',
                pesoAtual: Number(row['Peso_Atual']) || 0,
                pesoEntrada: Number(row['Peso_Atual']) || 0,
                gmd: 0,
                status: 'Ativo',
                birthDate: new Date().toISOString(),
                costCenter: 'CC01-PO' as any,
                gender: (row['Sexo'] === 'F' ? 'F' : 'M') as any,
              }
              newState.animais.push(newAnimal)
              successCount++
            }
          })
        }

        // Routine 2: Weighing History
        if (dataType === '2-Histórico de Pesagem') {
          rows.forEach((row, i) => {
            const brinco = row['Brinco_Animal']
            const peso = Number(row['Peso_Registrado'])
            if (!brinco || isNaN(peso)) {
              errors.push(`Linha ${i + 1}: Brinco ou Peso inválidos`)
              return
            }
            const animal = newState.animais.find((a) => a.brinco === brinco)
            if (!animal) {
              errors.push(`Linha ${i + 1}: Brinco [${brinco}] não encontrado`)
              return
            }

            const newGmd = (peso - animal.pesoAtual) / 30
            animal.pesoAtual = peso
            animal.gmd = newGmd > 0 ? newGmd : animal.gmd

            newState.pesagens.push({
              id: Math.random().toString(),
              animalId: animal.id,
              weight: peso,
              date: row['Data_Pesagem'] || new Date().toISOString(),
            })
            successCount++
          })
        }

        // Routine 3: Reproductive Events
        if (dataType === '3-Eventos Reprodutivos') {
          rows.forEach((row, i) => {
            const brinco = row['Brinco_Matriz']
            if (!brinco) {
              errors.push(`Linha ${i + 1}: Brinco_Matriz vazio`)
              return
            }
            const animal = newState.animais.find((a) => a.brinco === brinco)
            if (!animal) {
              errors.push(`Linha ${i + 1}: Matriz [${brinco}] não encontrada`)
              return
            }

            newState.reproducoes.push({
              id: Math.random().toString(),
              animalId: animal.id,
              type: (row['Tipo_Evento'] as any) || 'IATF',
              date: row['Data_Evento'] || new Date().toISOString(),
              previsaoToque: new Date().toISOString(),
              dpp: new Date().toISOString(),
              status: row['Resultado_Toque'] === 'Prenhe' ? 'Prenhe' : 'Aguardando Toque',
            })
            successCount++
          })
        }

        // Routine 4: Financial Transactions
        if (dataType === '4-Financeiro') {
          rows.forEach((row, i) => {
            const desc = row['Descricao_Lancamento'] || row['Descricao']
            const val = Number(row['Valor_Total'] || row['Valor_Parcela'])
            if (!desc || isNaN(val)) {
              errors.push(`Linha ${i + 1}: Descricao_Lancamento ou Valor_Total inválidos`)
              return
            }

            newState.transacoes.push({
              id: Math.random().toString(),
              Descricao_Lancamento: desc,
              Valor_Total: val,
              Tipo_Movimento: row['Tipo_Movimento'] === 'Despesa' ? 'Despesa' : 'Receita',
              Data_Competencia: row['Data_Competencia'] || new Date().toISOString(),
              Data_Vencimento: row['Data_Vencimento'] || new Date().toISOString(),
              Data_Efetivacao_Real: row['Data_Efetivacao_Real'] || undefined,
              Centro_Custo_Direcionado: row['Centro_Custo_Direcionado'] || 'CC01-Nelore PO',
              Status_Pagamento:
                row['Status_Pagamento'] === 'Efetivado'
                  ? 'Efetivado'
                  : row['Status_Pagamento'] === 'Atrasado'
                    ? 'Atrasado'
                    : 'Pendente',
              Macroconta_Inttegra: row['CENTROS DE CUSTO PAI'] || '7. OUTROS CRÉDITOS/DÉBITOS',
              Categoria_Inttegra: row['CENTROS DE CUSTO'] || 'Outros',
              Subcategoria_Detalhe: row['Subcategoria_Detalhe'] || '',
            })
            successCount++
          })
        }

        const isSuccess = errors.length === 0
        const status = isSuccess ? 'Concluído' : 'Com Erros'

        const logId = Math.random().toString()
        const newLog = {
          id: logId,
          Data_Upload: new Date().toISOString(),
          Usuario_Responsavel: newState.currentUser?.name || 'Sistema',
          Tipo_de_Dado: dataType,
          Arquivo_Upload: selectedFile.name,
          Status_Importacao: status as any,
          Total_Linhas_Processadas: successCount,
          Relatorio_de_Erros: errors.join(' | ') || 'Nenhum erro encontrado.',
        }

        newState.importLogs = [newLog, ...newState.importLogs]

        if (status === 'Concluído') {
          newState.auditLogs = [
            {
              id: Math.random().toString(),
              date: new Date().toISOString(),
              userName: newState.currentUser?.name || 'Sistema',
              action: 'Create',
              table: 'Múltiplas (Importação)',
              recordId: 'ETL-CSV',
              oldValue: '-',
              newValue: `Importação em massa realizada via CSV. Total de linhas: ${successCount}`,
            },
            ...newState.auditLogs,
          ]
        }

        return newState
      })

      setTimeout(() => {
        setIsProcessing(false)
        setSelectedFile(null)
        setDataType('')
        toast({
          title: errors.length > 0 ? 'Importação finalizada com avisos' : 'Importação Concluída!',
          description: `Processadas ${rows.length} linhas. ${errors.length} erros.`,
          variant: errors.length > 0 ? 'destructive' : 'default',
        })
      }, 800)
    }
    reader.readAsText(selectedFile)
  }

  const downloadTemplate = (type: string) => {
    let headers = ''
    let filename = ''
    switch (type) {
      case '1':
        headers = 'Brinco,RGD,Categoria,Sexo,Peso_Atual,Lote_Atual'
        filename = 'Template_Animais.csv'
        break
      case '2':
        headers = 'Brinco_Animal,Data_Pesagem,Peso_Registrado'
        filename = 'Template_Pesagem.csv'
        break
      case '3':
        headers = 'Brinco_Matriz,Data_Evento,Tipo_Evento,Touro_Utilizado,Resultado_Toque'
        filename = 'Template_Reproducao.csv'
        break
      case '4':
        headers =
          'Data_Competencia,Data_Vencimento,Data_Efetivacao_Real,Descricao_Lancamento,Tipo_Movimento,Centro_Custo_Direcionado,Valor_Total,Status_Pagamento,CENTROS DE CUSTO PAI,CENTROS DE CUSTO,Subcategoria_Detalhe'
        filename = 'Template_Financeiro_DRE.csv'
        break
    }
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <UploadCloud className="w-8 h-8 text-indigo-700" />
        <div>
          <h2 className="text-2xl font-bold text-emerald-900 tracking-tight">
            Central de Importação (ETL)
          </h2>
          <p className="text-sm text-muted-foreground">
            Migração em massa de dados via planilhas CSV. Mapeamento Inttegra embutido.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-subtle border-t-4 border-t-indigo-600">
          <CardHeader>
            <CardTitle>Nova Importação</CardTitle>
            <CardDescription>Envie o arquivo CSV preenchido corretamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo de Dado (Rotina)</label>
              <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo de destino..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-Cadastro de Animais">1-Cadastro de Animais</SelectItem>
                  <SelectItem value="2-Histórico de Pesagem">2-Histórico de Pesagem</SelectItem>
                  <SelectItem value="3-Eventos Reprodutivos">3-Eventos Reprodutivos</SelectItem>
                  <SelectItem value="4-Financeiro">4-Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'
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
              <FileSpreadsheet className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              {selectedFile ? (
                <div className="text-indigo-700 font-semibold">{selectedFile.name}</div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Arraste e solte o arquivo CSV aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou clique para procurar no computador
                  </p>
                </>
              )}
            </div>

            <Button
              className="w-full bg-indigo-700 hover:bg-indigo-800"
              disabled={!selectedFile || !dataType || isProcessing}
              onClick={processImport}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando Lote...
                </>
              ) : (
                'Iniciar Importação'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle>Modelos de Planilha</CardTitle>
            <CardDescription>
              Faça o download dos templates vazios padronizados para garantir sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-slate-700"
              onClick={() => downloadTemplate('1')}
            >
              <Download className="w-4 h-4 mr-3 text-emerald-600" />
              Template Cadastro de Animais
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-slate-700"
              onClick={() => downloadTemplate('2')}
            >
              <Download className="w-4 h-4 mr-3 text-emerald-600" />
              Template Histórico de Pesagem
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-slate-700"
              onClick={() => downloadTemplate('3')}
            >
              <Download className="w-4 h-4 mr-3 text-emerald-600" />
              Template Eventos Reprodutivos
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-slate-700"
              onClick={() => downloadTemplate('4')}
            >
              <Download className="w-4 h-4 mr-3 text-emerald-600" />
              Template Financeiro DRE
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Log de Importações (Tabela 16)</CardTitle>
          <CardDescription>Histórico de operações em massa realizadas no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-center">Linhas Processadas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Relatório</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.importLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {format(parseISO(log.Data_Upload), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">{log.Tipo_de_Dado}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.Arquivo_Upload}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {log.Total_Linhas_Processadas}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.Status_Importacao === 'Concluído' ? 'default' : 'destructive'}
                      className={log.Status_Importacao === 'Concluído' ? 'bg-emerald-600' : ''}
                    >
                      {log.Status_Importacao}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-xs max-w-[200px] truncate"
                    title={log.Relatorio_de_Erros}
                  >
                    {log.Status_Importacao === 'Com Erros' && (
                      <AlertCircle className="w-3 h-3 text-rose-500 inline mr-1" />
                    )}
                    {log.Relatorio_de_Erros}
                  </TableCell>
                </TableRow>
              ))}
              {state.importLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Nenhuma importação registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
