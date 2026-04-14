import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getEstoqueInsumos,
  createEstoqueInsumo,
  updateEstoqueInsumo,
  getEstoqueInsumo,
  EstoqueInsumo,
} from '@/services/estoque_insumos'
import { createEstoqueMovimentacao } from '@/services/estoque_movimentacoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export const CATEGORIAS_INSUMOS = [
  'Minerais',
  'Aditivos',
  'Sal',
  'Grãos',
  'Farelos',
  'Bagaço de Cana',
  'Casquinha de Soja',
  'DDG',
  'Outros',
]

const schema = z
  .object({
    is_novo: z.boolean().default(false),
    produto_id: z.string().optional(),
    nome_produto: z.string().optional(),
    unidade_medida: z.string().optional(),
    categoria: z.string().min(1, 'Categoria é obrigatória'),
    quantidade: z.number().positive('Quantidade deve ser maior que zero'),
    valor_unitario: z.number().min(0, 'Valor não pode ser negativo'),
    data: z.date(),
  })
  .refine(
    (data) => {
      if (data.is_novo) return !!data.nome_produto && !!data.unidade_medida
      return !!data.produto_id
    },
    { message: 'Preencha o produto corretamente', path: ['produto_id'] },
  )

export function ManualEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [insumos, setInsumos] = useState<EstoqueInsumo[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { is_novo: false, quantidade: 0, valor_unitario: 0, data: new Date() },
  })

  const isNovo = form.watch('is_novo')
  const produtoId = form.watch('produto_id')
  const dataVal = form.watch('data')

  useEffect(() => {
    getEstoqueInsumos().then(setInsumos).catch(console.error)
  }, [])

  useEffect(() => {
    if (!isNovo && produtoId) {
      const p = insumos.find((i) => i.id === produtoId)
      if (p?.categoria) form.setValue('categoria', p.categoria)
    }
  }, [produtoId, isNovo, insumos, form])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true)
    try {
      let finalProdutoId = values.produto_id
      if (values.is_novo) {
        const novo = await createEstoqueInsumo({
          produto: values.nome_produto!,
          unidade_medida: values.unidade_medida!,
          categoria: values.categoria,
          quantidade_atual: 0,
        })
        finalProdutoId = novo.id
      }

      await createEstoqueMovimentacao({
        tipo: 'ENTRADA_MANUAL',
        produto_id: finalProdutoId!,
        quantidade: values.quantidade,
        valor_unitario: values.valor_unitario,
        valor_total: values.quantidade * values.valor_unitario,
        data: values.data.toISOString(),
        usuario_id: user?.id,
      })

      const insumo = await getEstoqueInsumo(finalProdutoId!)
      await updateEstoqueInsumo(finalProdutoId!, {
        quantidade_atual: (insumo.quantidade_atual || 0) + values.quantidade,
        categoria: values.categoria,
      })

      toast({ title: 'Produto adicionado ao estoque com sucesso!' })
      form.reset({ is_novo: false, quantidade: 0, valor_unitario: 0, data: new Date() })
      getEstoqueInsumos().then(setInsumos)
      onSuccess?.()
    } catch (error) {
      toast({ title: 'Erro ao salvar entrada', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Entrada</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-2 pb-2">
            <Switch checked={isNovo} onCheckedChange={(v) => form.setValue('is_novo', v)} />
            <Label className="font-semibold text-[#094016]">
              Cadastrar novo produto na entrada
            </Label>
          </div>

          {isNovo ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input {...form.register('nome_produto')} />
              </div>
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input {...form.register('unidade_medida')} placeholder="kg, L, sc..." />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Produto Existente</Label>
              <Select value={produtoId} onValueChange={(v) => form.setValue('produto_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((i) => (
                    <SelectItem key={i.id} value={i.id!}>
                      {i.produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.produto_id && (
                <p className="text-xs text-red-500">{form.formState.errors.produto_id.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.watch('categoria')}
                onValueChange={(v) => form.setValue('categoria', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_INSUMOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataVal && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVal ? format(dataVal, 'dd/MM/yyyy') : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataVal}
                    onSelect={(d) => d && form.setValue('data', d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('quantidade', { valueAsNumber: true })}
              />
              {form.formState.errors.quantidade && (
                <p className="text-xs text-red-500">{form.formState.errors.quantidade.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor Unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('valor_unitario', { valueAsNumber: true })}
              />
              {form.formState.errors.valor_unitario && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.valor_unitario.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#094016] hover:bg-[#094016]/90"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Adicionar ao Estoque'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
