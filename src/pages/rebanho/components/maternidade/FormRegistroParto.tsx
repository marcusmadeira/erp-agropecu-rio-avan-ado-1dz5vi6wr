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
import { createRegistroNascimento } from '@/services/maternidade'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const schema = z.object({
  matriz_mae_id: z.string().min(1, 'Selecione a matriz mãe'),
  data_nascimento: z.string().min(1, 'A data é obrigatória'),
  sexo: z.string().min(1, 'Selecione o sexo'),
  peso_nascer: z.string().optional(),
  rgn_provisorio_abcz: z.string().min(1, 'Nº Tatuagem / Brinco é obrigatório'),
})

export function DialogRegistroParto({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess: () => void
}) {
  const [matrizes, setMatrizes] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      pb.collection('animais')
        .getFullList({ filter: "sexo='Fêmea' || categoria='Matriz PO'" })
        .then(setMatrizes)
        .catch(console.error)
    }
  }, [open])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      matriz_mae_id: '',
      data_nascimento: '',
      sexo: '',
      peso_nascer: '',
      rgn_provisorio_abcz: '',
    },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await createRegistroNascimento({
        matriz_mae_id: values.matriz_mae_id,
        data_nascimento: values.data_nascimento ? `${values.data_nascimento}T12:00:00.000Z` : null,
        sexo: values.sexo,
        peso_nascer: parseFloat(values.peso_nascer || '0') || null,
        rgn_provisorio_abcz: values.rgn_provisorio_abcz,
      })
      toast({ title: 'Nascimento registrado e animal adicionado ao estoque com sucesso.' })
      form.reset()
      onSuccess()
    } catch (e: any) {
      const msg = getErrorMessage(e)
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#094016]">Registrar Nascimento (Parto)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="matriz_mae_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matriz Mãe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {matrizes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.id_manejo_brinco} {m.nome ? `- ${m.nome}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rgn_provisorio_abcz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Tatuagem / Brinco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Macho">Macho</SelectItem>
                        <SelectItem value="Fêmea">Fêmea</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peso_nascer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso ao Nascer (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white font-bold"
            >
              Salvar Nascimento
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
