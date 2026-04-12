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

const schema = z.object({
  vaca_mae_id: z.string().min(1, 'Selecione a matriz mãe'),
  data_nascimento: z.string().min(1, 'A data é obrigatória'),
  sexo: z.string().min(1, 'Selecione o sexo'),
  peso_nascer: z.string().optional(),
  numero_tatuagem: z.string().min(1, 'Número da tatuagem é obrigatório'),
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
      vaca_mae_id: '',
      data_nascimento: '',
      sexo: '',
      peso_nascer: '',
      numero_tatuagem: '',
    },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await createRegistroNascimento(
        {
          vaca_mae_id: values.vaca_mae_id,
          data_nascimento: values.data_nascimento
            ? `${values.data_nascimento}T12:00:00.000Z`
            : null,
          sexo: values.sexo,
          peso_nascer: parseFloat(values.peso_nascer || '0') || null,
          numero_tatuagem: values.numero_tatuagem,
          status_rgn: 'Aguardando RGN',
        },
        {
          id_manejo_brinco: values.numero_tatuagem,
          nome: `Bezerro(a) ${values.numero_tatuagem}`,
          categoria: 'Bezerro',
          sexo: values.sexo,
          data_nascimento: values.data_nascimento
            ? `${values.data_nascimento}T12:00:00.000Z`
            : null,
          peso_atual_kg: parseFloat(values.peso_nascer || '0') || null,
          mae_id: values.vaca_mae_id,
          status: 'Aguardando Estoque',
        },
      )
      toast({ title: 'Nascimento registrado com sucesso' })
      form.reset()
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
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
              name="vaca_mae_id"
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
                name="numero_tatuagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Tatuagem</FormLabel>
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
