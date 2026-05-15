import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { PackageMinus, Loader2, Info, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getLotes } from '@/services/lotes'
import { getFormulacoes } from '@/services/formulacoes_racao'
import { registrarSaidaRacao, getHistoricoSaidaRacao } from '@/services/saida_racao'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  lote_id: z.string().min(1, 'Lote é obrigatório'),
  formulacao_id: z.string().min(1, 'Formulação é obrigatória'),
  quantidade_kg: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  data: z.string().min(1, 'Data é obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function SaidaRacao() {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])
  const [formulacoes, setFormulacoes] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data: new Date().toISOString().split('T')[0], quantidade_kg: 0 },
  })

  const selectedLoteId = form.watch('lote_id')

  const fetchData = async () => {
    try {
      const [lotesData, formList] = await Promise.all([getLotes(), getFormulacoes()])
      setLotes(lotesData)
      setFormulacoes(formList)
    } catch (err) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorico = async () => {
    if (!selectedLoteId) return setHistorico([])
    try {
      const data = await getHistoricoSaidaRacao(selectedLoteId)
      setHistorico(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    loadHistorico()
    const lote = lotes.find((l) => l.id === selectedLoteId)
    if (lote && lote.formulacao_id) form.setValue('formulacao_id', lote.formulacao_id)
  }, [selectedLoteId, lotes])

  useRealtime('trato_diario_lotes', () => {
    loadHistorico()
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await registrarSaidaRacao(data)
      toast({ title: 'Sucesso', description: 'Saída de ração registrada com sucesso!' })
      form.reset({ ...data, quantidade_kg: 0 })
    } catch (err) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        Object.keys(errs).forEach((k) => form.setError(k as any, { message: errs[k] }))
        toast({
          title: 'Atenção',
          description: 'Verifique os campos destacados.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao registrar saída',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <PackageMinus className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Saída de Ração</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Nova Saída</CardTitle>
            <CardDescription>Registre o trato diário fornecido ao lote.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Lote de Animais</Label>
                <Select
                  onValueChange={(val) => form.setValue('lote_id', val)}
                  value={form.watch('lote_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_lote}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.lote_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lote_id.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ração (Formulação)</Label>
                <Select
                  onValueChange={(val) => form.setValue('formulacao_id', val)}
                  value={form.watch('formulacao_id')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ração..." />
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
                <Label>Quantidade a usar (kg)</Label>
                <Input type="number" step="0.01" {...form.register('quantidade_kg')} />
                {form.formState.errors.quantidade_kg && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.quantidade_kg.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Data do Trato</Label>
                <Input type="date" {...form.register('data')} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar Saída
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Histórico de Consumo</CardTitle>
            <CardDescription>
              {selectedLoteId
                ? `Tratos registrados para o lote selecionado.`
                : 'Selecione um lote para ver o histórico.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                <Info className="h-8 w-8 mb-2 opacity-50" />
                <p>Nenhum registro encontrado para este lote.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Ração</th>
                      <th className="px-4 py-3 font-medium">Quantidade</th>
                      <th className="px-4 py-3 font-medium">Responsável</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historico.map((h) => (
                      <tr key={h.id} className="bg-card hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">{format(new Date(h.data), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3 font-medium">
                          {h.expand?.formulacao_id?.nome_formulacao || '-'}
                        </td>
                        <td className="px-4 py-3">{h.quantidade_kg_servida} kg</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.expand?.usuario_id?.name || h.expand?.usuario_id?.email || 'Sistema'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (
                                confirm('Deseja cancelar esta saída e reverter o estoque/custo?')
                              ) {
                                try {
                                  await pb.collection('trato_diario_lotes').delete(h.id)
                                  toast({ title: 'Saída revertida com sucesso!' })
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
