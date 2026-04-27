import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLote, updateLote } from '@/services/lotes'
import pb from '@/lib/pocketbase/client'
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
  centro_custo: z.string().min(1, 'Obrigatório'),
  piquete_atual_id: z.string().optional(),
  formulacao_id: z.string().optional(),
  quantidade_racao_diaria: z.coerce.number().min(0, 'Deve ser maior ou igual a zero').optional(),
})

type FormData = z.infer<typeof schema>

export default function LoteForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()
  const [pastos, setPastos] = useState<any[]>([])
  const [formulacoes, setFormulacoes] = useState<any[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_lote: '',
      centro_custo: '',
      piquete_atual_id: '',
      formulacao_id: '',
      quantidade_racao_diaria: 0,
    },
  })

  useEffect(() => {
    if (open) {
      pb.collection('pastos_e_piquetes')
        .getFullList()
        .then(setPastos)
        .catch(() => {})
      pb.collection('formulacoes_racao')
        .getFullList()
        .then(setFormulacoes)
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          nome_lote: item.nome_lote || '',
          centro_custo: item.centro_custo || '',
          piquete_atual_id: item.piquete_atual_id || '',
          formulacao_id: item.formulacao_id || '',
          quantidade_racao_diaria: item.quantidade_racao_diaria || 0,
        })
      } else {
        form.reset({
          nome_lote: '',
          centro_custo: '',
          piquete_atual_id: '',
          formulacao_id: '',
          quantidade_racao_diaria: 0,
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
          <DialogDescription>
            Defina as informações básicas e a nutrição padrão do lote.
          </DialogDescription>
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
                    <Input {...field} placeholder="Ex: Lote Recria 01" />
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
                  <FormLabel>Centro de Custo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CC01-Nelore PO">CC01 - Nelore PO</SelectItem>
                      <SelectItem value="CC02-Comercial TIP">CC02 - Comercial TIP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="piquete_atual_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piquete Atual</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum piquete vinculado" />
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

              <FormField
                control={form.control}
                name="formulacao_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nutrição Padrão (Ração)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhuma ração vinculada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formulacoes.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome_formulacao}
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
                name="quantidade_racao_diaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Ração Diária (kg/cabeça)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="Ex: 5.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <FormItem>
                <FormLabel className="text-slate-600">Quantidade de Cabeças no Lote</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={item?.quantidade_cabecas || 0}
                    disabled
                    className="font-semibold text-lg text-slate-800 bg-white"
                  />
                </FormControl>
                <p className="text-xs text-slate-500 mt-1">
                  Este valor é calculado automaticamente quando animais são movidos (Apartação).
                </p>
              </FormItem>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white min-w-[120px]"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando
                  </>
                ) : (
                  'Salvar Lote'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
