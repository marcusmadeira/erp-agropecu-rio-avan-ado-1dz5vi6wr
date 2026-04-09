import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLote, updateLote } from '@/services/lotes'
import { getPastos } from '@/services/pastos'
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
import { Loader2, Check, X, AlertTriangle } from 'lucide-react'

const schema = z.object({
  nome_lote: z.string().min(1, 'Nome do lote é obrigatório').max(100, 'Máximo 100 caracteres'),
  centro_custo: z.enum(['CC01-Nelore PO', 'CC02-Comercial TIP'], { required_error: 'Obrigatório' }),
  piquete_id: z.string().min(1, 'Piquete é obrigatório'),
  quantidade_cabecas: z.coerce
    .number({ required_error: 'Obrigatório' })
    .positive('Deve ser positivo'),
  peso_medio_lote: z.coerce.number({ required_error: 'Obrigatório' }).positive('Deve ser positivo'),
})

type FormData = z.infer<typeof schema>

export default function LoteForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()
  const [pastos, setPastos] = useState<any[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_lote: '',
      centro_custo: undefined,
      piquete_id: '',
      quantidade_cabecas: '' as any,
      peso_medio_lote: '' as any,
    },
  })

  useEffect(() => {
    if (open) {
      getPastos()
        .then(setPastos)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          ...item,
          quantidade_cabecas: item.quantidade_cabecas || '',
          peso_medio_lote: item.peso_medio_lote || '',
          piquete_id: item.piquete_id || '',
        })
      } else {
        form.reset({
          nome_lote: '',
          centro_custo: undefined,
          piquete_id: '',
          quantidade_cabecas: '' as any,
          peso_medio_lote: '' as any,
        })
      }
    }
  }, [item, form, open])

  const onSubmit = async (data: FormData) => {
    try {
      if (item) await updateLote(item.id, data)
      else await createLote(data)

      toast({
        title: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Sucesso
          </div>
        ),
        description: `Lote ${item ? 'atualizado' : 'criado'} com sucesso!`,
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
          description: e.message || 'Erro ao salvar. Verifique se o Nome do Lote já existe.',
          className: 'bg-red-600 text-white border-red-700',
          duration: 3000,
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
          <DialogDescription>Acompanhe os lotes do seu rebanho e seus custos.</DialogDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="centro_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Custo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CC01-Nelore PO">CC01-PO</SelectItem>
                        <SelectItem value="CC02-Comercial TIP">CC02-TIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="piquete_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piquete *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pastos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade_cabecas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Cabeças *</FormLabel>
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
                    <FormLabel>Peso Médio (kg) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
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
      </DialogContent>
    </Dialog>
  )
}
