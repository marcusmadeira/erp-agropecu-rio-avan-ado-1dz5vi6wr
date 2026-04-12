import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getBezerros, destinarBezerro } from '@/services/maternidade'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  animal_id: z.string().min(1, 'Selecione o bezerro'),
  destino: z.string().min(1, 'Selecione o destino'),
  motivo: z.string().min(1, 'Informe o motivo ou observação'),
})

export function DialogDestinacao({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}) {
  const [bezerros, setBezerros] = useState<any[]>([])

  useEffect(() => {
    if (open) getBezerros().then(setBezerros).catch(console.error)
  }, [open])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { animal_id: '', destino: '', motivo: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await destinarBezerro(values.animal_id, values.destino, values.motivo)
      toast({ title: 'Destinação registrada com sucesso' })
      form.reset()
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao registrar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#094016]">Destinar Bezerro</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="animal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bezerro</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bezerros.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.id_manejo_brinco} - {b.nome || 'Sem Nome'}
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
              name="destino"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Registrar Touro">Registrar como Touro (PO)</SelectItem>
                      <SelectItem value="Comercial">Destinação Comercial</SelectItem>
                      <SelectItem value="Descartar">Descartar (Culling)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo / Observações</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Avaliação genética excelente" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white font-bold"
            >
              Salvar Destinação
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
