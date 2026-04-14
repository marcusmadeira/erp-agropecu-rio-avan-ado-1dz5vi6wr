import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { getInsumos, EstoqueInsumo } from '@/services/estoque_insumos'
import { getFormulacao, createFormulacao, updateFormulacao } from '@/services/formulacoes_racao'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

const categorias = [
  'Bezerro Desmama',
  'Recria Macho',
  'Recria Fêmea',
  'Touros para Vendas',
  'Matrizes',
  'Novilhas',
  'Outras',
]

const formSchema = z
  .object({
    nome_formulacao: z.string().min(1, 'Nome é obrigatório'),
    categoria_animal: z.string().min(1, 'Categoria é obrigatória'),
    ingredientes: z
      .array(
        z.object({
          id_produto: z.string().min(1, 'Selecione um insumo'),
          proporcao_percentual: z.coerce.number().min(0.01, 'Min: 0.01').max(100, 'Máx: 100'),
        }),
      )
      .min(1, 'Adicione pelo menos um ingrediente'),
  })
  .refine(
    (data) => {
      const total = data.ingredientes.reduce(
        (acc, curr) => acc + (curr.proporcao_percentual || 0),
        0,
      )
      return Math.abs(total - 100) < 0.01
    },
    {
      message: 'O total das proporções deve ser exatamente 100%',
      path: ['ingredientes'],
    },
  )

export default function ReceitaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [insumos, setInsumos] = useState<EstoqueInsumo[]>([])
  const [loading, setLoading] = useState(false)
  const isEditing = Boolean(id)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_formulacao: '',
      categoria_animal: '',
      ingredientes: [{ id_produto: '', proporcao_percentual: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredientes',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const insumosData = await getInsumos()
        setInsumos(insumosData)
        if (isEditing && id) {
          const item = await getFormulacao(id)
          form.reset({
            nome_formulacao: item.nome_formulacao,
            categoria_animal: item.categoria_animal || '',
            ingredientes: item.ingredientes?.length ? item.ingredientes : [],
          })
        }
      } catch (err) {
        toast({ title: 'Erro', description: 'Erro ao carregar dados.', variant: 'destructive' })
      }
    }
    init()
  }, [id, isEditing, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      if (isEditing && id) {
        await updateFormulacao(id, values)
        toast({ title: 'Sucesso', description: 'Receita atualizada.' })
      } else {
        await createFormulacao(values)
        toast({ title: 'Sucesso', description: 'Receita criada.' })
      }
      navigate('/receitas-racao')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const ingredientesWatcher = form.watch('ingredientes')
  const totalPercent = ingredientesWatcher.reduce(
    (acc, curr) => acc + (Number(curr.proporcao_percentual) || 0),
    0,
  )
  const custoEstimado = ingredientesWatcher.reduce((acc, curr) => {
    const insumo = insumos.find((i) => i.id === curr.id_produto)
    const val = insumo?.custo_medio_unitario || 0
    return acc + ((Number(curr.proporcao_percentual) || 0) / 100) * val
  }, 0)

  const isTotalCorrect = Math.abs(totalPercent - 100) < 0.01

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/receitas-racao')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          {isEditing ? 'Editar Receita' : 'Nova Receita'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Formulação</CardTitle>
          <CardDescription>
            Defina o nome, a categoria alvo e as proporções exatas (100%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome_formulacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Receita</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Engorda Final" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria_animal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria Animal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Ingredientes</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id_produto: '', proporcao_percentual: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                  <div className="col-span-7">Insumo</div>
                  <div className="col-span-4">Proporção (%)</div>
                  <div className="col-span-1"></div>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-7">
                      <FormField
                        control={form.control}
                        name={`ingredientes.${index}.id_produto`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Insumo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {insumos.map((i) => (
                                  <SelectItem key={i.id} value={i.id}>
                                    {i.produto}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`ingredientes.${index}.proporcao_percentual`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === '' ? '' : parseFloat(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {form.formState.errors.ingredientes?.root?.message && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.ingredientes.root.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between bg-muted/50 p-4 rounded-md border mt-6">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">Total Proporção:</span>
                    <span
                      className={cn(
                        'font-bold text-lg',
                        isTotalCorrect ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {totalPercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">Custo Estimado/kg:</span>
                    <span className="font-bold text-lg">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(custoEstimado)}
                    </span>
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Receita
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
