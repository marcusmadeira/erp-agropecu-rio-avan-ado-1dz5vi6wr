import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLote, updateLote } from '@/services/lotes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

const schema = z.object({
  nome_lote: z.string().min(1, 'Nome do lote é obrigatório'),
  centro_custo: z.string().optional(),
  quantidade_cabecas: z.coerce.number().optional().or(z.literal('')),
  peso_medio_lote: z.coerce.number().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function LoteForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_lote: '',
      centro_custo: '',
      quantidade_cabecas: '' as any,
      peso_medio_lote: '' as any,
    },
  })

  useEffect(() => {
    if (item)
      form.reset({
        ...item,
        quantidade_cabecas: item.quantidade_cabecas || '',
        peso_medio_lote: item.peso_medio_lote || '',
      })
    else
      form.reset({
        nome_lote: '',
        centro_custo: '',
        quantidade_cabecas: '' as any,
        peso_medio_lote: '' as any,
      })
  }, [item, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        quantidade_cabecas: data.quantidade_cabecas === '' ? null : data.quantidade_cabecas,
        peso_medio_lote: data.peso_medio_lote === '' ? null : data.peso_medio_lote,
      }

      if (item) await updateLote(item.id, payload)
      else await createLote(payload)

      toast({ title: 'Salvo com sucesso' })
      onOpenChange(false)
    } catch (e: any) {
      const errs = extractFieldErrors(e)
      Object.keys(errs).forEach((k) => form.setError(k as any, { message: errs[k] }))
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_lote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Lote *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="centro_custo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CC01-Nelore PO">CC01-Nelore PO</SelectItem>
                      <SelectItem value="CC02-Comercial TIP">CC02-Comercial TIP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade_cabecas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Cabeças</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peso_medio_lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Médio (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
