import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAnimal, updateAnimal, getAnimais } from '@/services/animais'
import { getLotes } from '@/services/lotes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2, Sparkles, Check, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiAssistantChat } from '@/components/AiAssistantChat'

const schema = z.object({
  nome: z.string().min(1, 'Obrigatório').max(100, 'Máximo 100 caracteres'),
  id_manejo_brinco: z.string().min(1, 'Obrigatório').max(20, 'Máximo 20 caracteres'),
  rgd_rgn_abcz: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  categoria: z.enum(['Matriz PO', 'Touro PO', 'Bezerro', 'Novilha TIP', 'Garrote TIP'], {
    required_error: 'Obrigatório',
  }),
  data_nascimento: z
    .string()
    .min(1, 'Obrigatório')
    .refine((v) => {
      const d = new Date(v)
      d.setHours(23, 59, 59, 999)
      return d <= new Date()
    }, 'Não pode ser no futuro'),
  peso_atual_kg: z.coerce
    .number({ required_error: 'Obrigatório' })
    .positive('Deve ser positivo')
    .max(2000, 'Máximo 2000kg'),
  pai_id: z.string().optional().or(z.literal('')),
  mae_id: z.string().optional().or(z.literal('')),
  lote_atual: z.string().min(1, 'Obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function AnimalForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [showAi, setShowAi] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      id_manejo_brinco: '',
      rgd_rgn_abcz: '',
      categoria: undefined,
      data_nascimento: '',
      peso_atual_kg: '' as any,
      pai_id: '',
      mae_id: '',
      lote_atual: '',
    },
  })

  useEffect(() => {
    if (open) {
      getLotes()
        .then(setLotes)
        .catch(() => {})
      getAnimais()
        .then(setAnimais)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (item) {
        const d = item.data_nascimento ? new Date(item.data_nascimento) : new Date()
        const formattedDate = d.toISOString().split('T')[0]
        form.reset({
          ...item,
          data_nascimento: formattedDate,
          peso_atual_kg: item.peso_atual_kg || '',
          pai_id: item.pai_id || '',
          mae_id: item.mae_id || '',
        })
      } else {
        form.reset({
          nome: '',
          id_manejo_brinco: '',
          rgd_rgn_abcz: '',
          categoria: undefined,
          data_nascimento: '',
          peso_atual_kg: '' as any,
          pai_id: '',
          mae_id: '',
          lote_atual: '',
        })
      }
      setShowAi(false)
    }
  }, [item, form, open])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        data_nascimento: new Date(data.data_nascimento + 'T12:00:00Z').toISOString(),
      }
      if (!payload.pai_id) delete payload.pai_id
      if (!payload.mae_id) delete payload.mae_id

      if (item) await updateAnimal(item.id, payload)
      else await createAnimal(payload)

      toast({
        title: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Sucesso
          </div>
        ),
        description: `Animal ${item ? 'atualizado' : 'criado'} com sucesso!`,
        className: 'bg-green-600 text-white border-green-700',
        duration: 3000,
      })
      onOpenChange(false)
    } catch (e: any) {
      const errs = extractFieldErrors(e)
      if (Object.keys(errs).length > 0) {
        Object.keys(errs).forEach((k) => form.setError(k as any, { message: errs[k] }))
        toast({
          title: (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Atenção
            </div>
          ),
          description: 'Verifique os campos destacados.',
          className: 'bg-yellow-500 text-white border-yellow-600',
          duration: 3000,
        })
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" /> Erro
            </div>
          ),
          description: e.message || 'Erro ao salvar. Verifique se o Brinco já existe.',
          className: 'bg-red-600 text-white border-red-700',
          duration: 3000,
        })
      }
    }
  }

  const handleAiSuggestion = (suggestion: any) => {
    Object.keys(suggestion).forEach((k) => {
      form.setValue(k as any, suggestion[k], { shouldValidate: true })
    })
    toast({ description: 'Sugestão aplicada no formulário.', duration: 2000 })
  }

  const watchCategoria = form.watch('categoria')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('transition-all duration-300 max-w-lg', showAi && 'max-w-4xl')}>
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Animal' : 'Novo Animal'}</DialogTitle>
          <DialogDescription>Preencha os dados do animal abaixo.</DialogDescription>
        </DialogHeader>

        <div className={cn('grid gap-6', showAi ? 'grid-cols-[1fr_300px]' : 'grid-cols-1')}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 max-h-[60vh] overflow-y-auto px-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="id_manejo_brinco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brinco *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Matriz PO', 'Touro PO', 'Bezerro', 'Novilha TIP', 'Garrote TIP'].map(
                            (c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="peso_atual_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rgd_rgn_abcz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RGD/RGN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pai_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pai</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Opcional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {animais
                            .filter((a) => a.categoria === 'Touro PO')
                            .map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.nome || a.id_manejo_brinco}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mae_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mãe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Opcional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {animais
                            .filter((a) => a.categoria === 'Matriz PO')
                            .map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.nome || a.id_manejo_brinco}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lote_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lotes.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.nome_lote}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAi(!showAi)}
                  className="text-[#094016] border-[#094016]"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Ajuda ADAPT
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-[#094016] hover:bg-[#094016]/90 text-white min-w-[120px]"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {showAi && (
            <AiAssistantChat
              contextData={{ categoria: watchCategoria, animais }}
              onAcceptSuggestion={handleAiSuggestion}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
