import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAnimal, updateAnimal } from '@/services/animais'
import { getLotes } from '@/services/lotes'
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
  id_manejo_brinco: z.string().min(1, 'Brinco é obrigatório'),
  rgd_rgn_abcz: z.string().optional(),
  categoria: z.string().optional(),
  status: z.string().optional(),
  lote_atual: z.string().optional(),
  peso_atual_kg: z.coerce.number().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function AnimalForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() => {})
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id_manejo_brinco: '',
      rgd_rgn_abcz: '',
      categoria: '',
      status: '',
      lote_atual: '',
      peso_atual_kg: '' as any,
    },
  })

  useEffect(() => {
    if (item) form.reset({ ...item, peso_atual_kg: item.peso_atual_kg || '' })
    else
      form.reset({
        id_manejo_brinco: '',
        rgd_rgn_abcz: '',
        categoria: '',
        status: '',
        lote_atual: '',
        peso_atual_kg: '' as any,
      })
  }, [item, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        peso_atual_kg: data.peso_atual_kg === '' ? null : data.peso_atual_kg,
      }
      if (!payload.lote_atual) delete payload.lote_atual

      if (item) await updateAnimal(item.id, payload)
      else await createAnimal(payload)

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
          <DialogTitle>{item ? 'Editar Animal' : 'Novo Animal'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id_manejo_brinco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brinco (ID Manejo) *</FormLabel>
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
              <FormField
                control={form.control}
                name="peso_atual_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matriz PO">Matriz PO</SelectItem>
                        <SelectItem value="Touro PO">Touro PO</SelectItem>
                        <SelectItem value="Bezerro">Bezerro</SelectItem>
                        <SelectItem value="Novilha TIP">Novilha TIP</SelectItem>
                        <SelectItem value="Garrote TIP">Garrote TIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
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
                  <FormLabel>Lote</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
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
            <div className="flex justify-end pt-2">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
