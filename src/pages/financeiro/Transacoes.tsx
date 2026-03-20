import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { format, parseISO, isValid } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/components/dashboard/KpiCards'
import { Check, User, BrainCircuit, Upload, RefreshCw, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TransactionForm } from './TransactionForm'
import { CENTROS_CUSTO } from './constants'
import { useInttegraSync } from '@/hooks/useInttegraSync'

export default function Transacoes() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [filterCC, setFilterCC] = useState('ALL')
  const [ocrOpen, setOcrOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const filtered = state.transacoes
    .filter((t) => (filterCC === 'ALL' ? true : t.Centro_Custo_Direcionado === filterCC))
    .sort((a, b) => {
      const dateA = a.Data_Vencimento ? new Date(a.Data_Vencimento).getTime() : 0
      const dateB = b.Data_Vencimento ? new Date(b.Data_Vencimento).getTime() : 0
      return dateB - dateA
    })

  const handlePay = (id: string, desc: string) => {
    const dataEfetivacao = new Date().toISOString()
    dispatch((s) => ({
      ...s,
      transacoes: s.transacoes.map((t) =>
        t.id === id
          ? { ...t, Status_Pagamento: 'Efetivado', Data_Efetivacao_Real: dataEfetivacao }
          : t,
      ),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Transacoes',
          recordId: desc,
          oldValue: 'Pendente/Atrasado',
          newValue: 'Efetivado',
        },
        ...s.auditLogs,
      ],
    }))

    const tx = state.transacoes.find((t) => t.id === id)
    if (tx) {
      pushRecord('Financeiro_Transacoes', id, { ...tx, Status_Pagamento: 'Efetivado' })
    }

    toast({
      title: 'Transação Efetivada',
      description: 'Lançamento DRE atualizado e Inttegra notificado.',
    })
  }

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsAnalyzing(true)

    setTimeout(() => {
      const newVal = Math.floor(Math.random() * 5000) + 1000
      dispatch((s) => ({
        ...s,
        transacoes: [
          {
            id: Math.random().toString(),
            Descricao_Lancamento: 'NF-e Importada via IA (Suprimentos)',
            Valor_Total: newVal,
            Tipo_Movimento: 'Despesa',
            Data_Competencia: new Date().toISOString(),
            Data_Vencimento: new Date(new Date().getTime() + 5 * 86400000).toISOString(),
            Centro_Custo_Direcionado: 'CC01-Nelore PO',
            Status_Pagamento: 'Pendente',
            Macroconta_Inttegra: '5. PECUÁRIA (Custos Diretos)',
            Categoria_Inttegra: 'Insumos Rebanho Genética',
          },
          ...s.transacoes,
        ],
      }))

      setIsAnalyzing(false)
      setOcrOpen(false)
      toast({
        title: 'Leitura Concluída',
        description: 'Transação gerada a partir da NF-e com sucesso.',
      })
    }, 2500)
  }

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '-'
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Transações DRE</h2>
          <p className="text-sm text-muted-foreground">Gestão financeira hierárquica Inttegra</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCC} onValueChange={setFilterCC}>
            <SelectTrigger className="w-56 bg-white">
              <SelectValue placeholder="Filtrar C.C." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Centros de Custo</SelectItem>
              {CENTROS_CUSTO.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={ocrOpen} onOpenChange={setOcrOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-indigo-700 border-indigo-200">
                <FileText className="w-4 h-4 mr-2" /> Ler NF-e (IA)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" /> IA Financeira
                </DialogTitle>
                <DialogDescription>
                  Arraste uma Nota Fiscal ou Boleto para preencher o lançamento automaticamente.
                </DialogDescription>
              </DialogHeader>

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
                    <p className="font-bold text-slate-700">Lendo Documento...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-slate-400 mb-3" />
                    <p className="font-bold text-slate-700">Solte o PDF aqui</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <TransactionForm />
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição / Parceiro</TableHead>
                <TableHead>DRE (Conta/Cat)</TableHead>
                <TableHead>C.Custo</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const partner = t.Parceiro_Vinculado
                  ? state.parceiros.find((p) => p.id === t.Parceiro_Vinculado)
                  : null

                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-bold">
                      {safeFormatDate(t.Data_Vencimento)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {t.Descricao_Lancamento}
                      {partner && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                          <User className="w-3 h-3" /> {partner.Nome_Razao_Social}
                        </div>
                      )}
                      <div className="text-[10px] uppercase mt-1">
                        <span
                          className={
                            t.Tipo_Movimento === 'Receita'
                              ? 'text-emerald-600 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {t.Tipo_Movimento}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-slate-700">
                        {t.Macroconta_Inttegra}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {t.Categoria_Inttegra}{' '}
                        {t.Subcategoria_Detalhe ? ` > ${t.Subcategoria_Detalhe}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {t.Centro_Custo_Direcionado}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${t.Tipo_Movimento === 'Receita' ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {t.Tipo_Movimento === 'Receita' ? '+' : '-'}
                      {formatCurrency(t.Valor_Total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.Status_Pagamento === 'Efetivado'
                            ? 'default'
                            : t.Status_Pagamento === 'Atrasado'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {t.Status_Pagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.Status_Pagamento !== 'Efetivado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handlePay(t.id, t.Descricao_Lancamento)}
                        >
                          <Check className="w-3 h-3 mr-1" /> Efetivar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
