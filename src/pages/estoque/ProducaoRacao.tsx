import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Factory, AlertTriangle, CheckCircle2, History, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function ProducaoRacao() {
  const { toast } = useToast()
  const [formulacoes, setFormulacoes] = useState<any[]>([])
  const [itensFormulacao, setItensFormulacao] = useState<any[]>([])
  const [insumos, setInsumos] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])

  const [receitaId, setReceitaId] = useState('')
  const [quantidadeKg, setQuantidadeKg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [fRes, iRes, insRes, hRes] = await Promise.all([
        pb.collection('formulacoes_racao').getFullList(),
        pb.collection('itens_formulacao').getFullList(),
        pb.collection('estoque_insumos').getFullList(),
        pb
          .collection('racao_formulada')
          .getFullList({ sort: '-data_producao', expand: 'receita_id,usuario_id' }),
      ])
      setFormulacoes(fRes)
      setItensFormulacao(iRes)
      setInsumos(insRes)
      setHistorico(hRes)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('formulacoes_racao', loadData)
  useRealtime('itens_formulacao', loadData)
  useRealtime('estoque_insumos', loadData)
  useRealtime('racao_formulada', loadData)

  const qty = Number(quantidadeKg) || 0

  const validation = useMemo(() => {
    if (!receitaId || qty <= 0) return { items: [], isValid: false }

    const recipe = formulacoes.find((f) => f.id === receitaId)
    const ingredientes = recipe?.ingredientes || []
    let isValid = true

    const items = ingredientes.map((item: any) => {
      const insumo = insumos.find((ins) => ins.id === item.id_produto)
      const reqQty = ((item.proporcao_percentual || 0) / 100) * qty
      const currQty = insumo?.quantidade_atual || 0
      const hasEnough = currQty >= reqQty
      if (!hasEnough) isValid = false

      return {
        id: item.id_produto,
        name: insumo?.produto || 'Desconhecido',
        reqQty,
        currQty,
        hasEnough,
      }
    })

    return { items, isValid: items.length > 0 && isValid }
  }, [receitaId, qty, formulacoes, insumos])

  const handleProduce = async () => {
    if (!validation.isValid || isSubmitting) return
    setIsSubmitting(true)

    try {
      await pb.send('/backend/v1/produzir-racao', {
        method: 'POST',
        body: JSON.stringify({
          receita_id: receitaId,
          quantidade_kg: qty,
          data_producao: new Date().toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({ title: 'Produção registrada com sucesso!' })
      setQuantidadeKg('')
      setReceitaId('')
    } catch (error: any) {
      toast({
        title: 'Erro na produção',
        description: error.message || 'Falha ao produzir.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Factory className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Produção de Ração</h2>
            <p className="text-sm text-muted-foreground">
              Lance lotes de produção e baixe o estoque automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 h-fit border-t-4 border-t-emerald-600 shadow-sm">
          <CardHeader>
            <CardTitle>Nova Produção</CardTitle>
            <CardDescription>Parâmetros do lote a ser produzido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Receita / Formulação</Label>
              <Select value={receitaId} onValueChange={setReceitaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a receita..." />
                </SelectTrigger>
                <SelectContent>
                  {formulacoes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome_formulacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade a Produzir (Kg)</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 2000"
                value={quantidadeKg}
                onChange={(e) => setQuantidadeKg(e.target.value)}
                className="font-mono text-lg"
              />
            </div>

            <Button
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all"
              onClick={handleProduce}
              disabled={!validation.isValid || isSubmitting}
            >
              {isSubmitting ? (
                'Processando...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Efetivar Produção
                </>
              )}
            </Button>

            {!validation.isValid && receitaId && qty > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Estoque insuficiente para produzir esta quantidade. Verifique os insumos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-8 shadow-sm">
          <CardHeader>
            <CardTitle>Validação de Insumos</CardTitle>
            <CardDescription>Confira o consumo necessário vs. estoque atual</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Necessário (Kg)</TableHead>
                  <TableHead className="text-right">Em Estoque (Kg)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validation.items.length > 0 ? (
                  validation.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.reqQty.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.currQty.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.hasEnough ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Suficiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Falta
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {receitaId
                        ? 'Informe a quantidade para calcular os insumos.'
                        : 'Selecione uma receita para ver os insumos necessários.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Histórico de Produção</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>Data</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead className="text-right">Qtd (Kg)</TableHead>
                <TableHead className="text-right">Custo Insumos</TableHead>
                <TableHead className="text-right">Custo Rateado</TableHead>
                <TableHead className="text-right">Custo Final/Kg</TableHead>
                <TableHead className="text-right">Responsável</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.length > 0 ? (
                historico.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{format(new Date(h.data_producao), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-medium">
                      {h.expand?.receita_id?.nome_formulacao || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {h.quantidade_kg.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R${' '}
                      {(h.custo_ingredientes || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R${' '}
                      {(h.custo_despesas_rateado || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700">
                      R${' '}
                      {(h.custo_total_kg || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {h.expand?.usuario_id?.name || h.expand?.usuario_id?.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (confirm('Deseja cancelar esta produção e reverter o estoque?')) {
                            try {
                              await pb.collection('racao_formulada').delete(h.id)
                              toast({ title: 'Produção revertida com sucesso!' })
                            } catch (e: any) {
                              toast({
                                title: 'Erro ao reverter',
                                description: e.message,
                                variant: 'destructive',
                              })
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhum lote produzido ainda.
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
