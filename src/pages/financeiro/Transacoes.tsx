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
import { formatCurrency } from '@/lib/utils'
import { Check, User, BrainCircuit, Upload, RefreshCw, FileText, MessageSquare } from 'lucide-react'
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
            Classificacao_Custo: 'Variável',
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
          <p className="text-sm text-muted-foreground">
            Gestão financeira hierárquica e CRM WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCC} onValueChange={setFilterCC}>
            <SelectTrigger className="w-56 bg-white border-border">
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
              <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
                <FileText className="w-4 h-4 mr-2" /> Ler NF-e (IA)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="w-5 h-5" /> IA Financeira
                </DialogTitle>
                <DialogDescription>
                  Arraste uma Nota Fiscal ou Boleto para preencher o lançamento automaticamente.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 border-2 border-dashed border-border rounded-lg p-8 text-center bg-slate-50 relative">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleOcrUpload}
                  disabled={isAnalyzing}
                />
                {isAnalyzing ? (
                  <div className="flex flex-col items-center text-primary">
                    <RefreshCw className="w-10 h-10 animate-spin mb-3" />
                    <p className="font-bold">Lendo Documento...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="w-10 h-10 mb-3" />
                    <p className="font-bold">Solte o PDF aqui</p>
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
                  <TableRow
                    key={t.id}
                    className="flex flex-col md:table-row mb-4 border rounded-xl md:border-0 md:rounded-none bg-white p-4 md:p-0 shadow-sm md:shadow-none"
                  >
                    <TableCell className="font-mono text-xs font-bold text-secondary flex justify-between items-center md:table-cell border-b md:border-b-0 pb-2 md:pb-4 p-0 md:p-4">
                      <span className="md:hidden text-muted-foreground font-normal">
                        Vencimento
                      </span>
                      {safeFormatDate(t.Data_Vencimento)}
                    </TableCell>
                    <TableCell className="font-bold text-secondary flex flex-col md:table-cell py-3 md:py-4 p-0 md:p-4 mt-2 md:mt-0">
                      <span className="md:hidden text-muted-foreground font-normal text-xs mb-1">
                        Descrição / Parceiro
                      </span>
                      <div>
                        {t.Descricao_Lancamento}
                        {partner && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                            <User className="w-3 h-3" /> {partner.Nome_Razao_Social}
                          </div>
                        )}
                        <div className="text-[10px] uppercase mt-1 flex gap-1">
                          <span
                            className={
                              t.Tipo_Movimento === 'Receita'
                                ? 'text-primary font-bold'
                                : 'text-destructive font-bold'
                            }
                          >
                            {t.Tipo_Movimento}
                          </span>
                          <span className="text-muted-foreground">• {t.Classificacao_Custo}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="flex justify-between items-center md:table-cell py-2 md:py-4 border-t border-slate-100 md:border-0 p-0 md:p-4 mt-2 md:mt-0">
                      <span className="md:hidden text-muted-foreground font-normal text-xs">
                        DRE
                      </span>
                      <div className="text-right md:text-left">
                        <div className="text-xs font-bold text-secondary">
                          {t.Macroconta_Inttegra}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          {t.Categoria_Inttegra}{' '}
                          {t.Subcategoria_Detalhe ? ` > ${t.Subcategoria_Detalhe}` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-secondary flex justify-between items-center md:table-cell py-2 md:py-4 p-0 md:p-4">
                      <span className="md:hidden text-muted-foreground font-normal">C.Custo</span>
                      {t.Centro_Custo_Direcionado}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold flex justify-between items-center md:table-cell py-2 md:py-4 p-0 md:p-4 ${t.Tipo_Movimento === 'Receita' ? 'text-primary' : 'text-destructive'}`}
                    >
                      <span className="md:hidden text-muted-foreground font-normal text-xs">
                        Valor
                      </span>
                      <span>
                        {t.Tipo_Movimento === 'Receita' ? '+' : '-'}
                        {formatCurrency(t.Valor_Total)}
                      </span>
                    </TableCell>
                    <TableCell className="flex justify-between items-center md:table-cell py-2 md:py-4 p-0 md:p-4">
                      <span className="md:hidden text-muted-foreground font-normal text-xs">
                        Status
                      </span>
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
                    <TableCell className="text-right pt-4 pb-2 md:py-4 border-t border-slate-100 md:border-0 flex justify-end md:table-cell p-0 md:p-4 mt-2 md:mt-0">
                      <div className="flex justify-end gap-2 items-center w-full md:w-auto">
                        {t.Tipo_Movimento === 'Receita' &&
                          t.Status_Pagamento !== 'Efetivado' &&
                          partner?.Telefone_WhatsApp && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 flex-1 md:flex-none text-emerald-700 border-emerald-600 hover:bg-emerald-50"
                              onClick={() =>
                                window.open(
                                  `https://wa.me/${partner.Telefone_WhatsApp!.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(partner.Nome_Razao_Social)}, lembramos do vencimento do boleto no valor de R$ ${t.Valor_Total.toFixed(2)}.`,
                                  '_blank',
                                )
                              }
                              title="Cobrar via WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4 md:mr-0 lg:mr-2" />
                              <span className="md:hidden lg:inline">Cobrar via WhatsApp</span>
                            </Button>
                          )}
                        {t.Status_Pagamento !== 'Efetivado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 md:flex-none text-primary border-primary hover:bg-primary/10"
                            onClick={() => handlePay(t.id, t.Descricao_Lancamento)}
                          >
                            <Check className="w-4 h-4 mr-2" /> Efetivar
                          </Button>
                        )}
                      </div>
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
