import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createParceiro, updateParceiro } from '@/services/parceiros_negocios'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const schema = z
  .object({
    nome_razao_social: z.string().min(1, 'Nome é obrigatório'),
    tipo_documento: z.string().optional(),
    numero_documento: z.string().optional(),
    rg: z.string().optional(),
    data_nascimento: z.string().optional(),
    contato_whatsapp: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    endereco: z.string().optional(),
    endereco_envio: z.string().optional(),
    categoria_parceiro: z.string().optional(),
    status: z.string().optional(),
    permitir_venda_prazo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.permitir_venda_prazo) {
      if (!data.numero_documento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF/CNPJ é obrigatório para venda a prazo',
          path: ['numero_documento'],
        })
      }
      if (!data.rg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RG é obrigatório para venda a prazo',
          path: ['rg'],
        })
      }
    }
  })

type FormData = z.infer<typeof schema>

export default function ParceiroForm({ open, onOpenChange, item }: any) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('identificacao')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_razao_social: '',
      tipo_documento: '',
      numero_documento: '',
      rg: '',
      data_nascimento: '',
      contato_whatsapp: '',
      email: '',
      endereco: '',
      endereco_envio: '',
      categoria_parceiro: 'Fornecedor',
      status: 'Ativo',
      permitir_venda_prazo: false,
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        ...item,
        data_nascimento: item.data_nascimento ? item.data_nascimento.split('T')[0] : '',
        permitir_venda_prazo: item.permitir_venda_prazo || false,
      })
    } else {
      form.reset({
        nome_razao_social: '',
        tipo_documento: '',
        numero_documento: '',
        rg: '',
        data_nascimento: '',
        contato_whatsapp: '',
        email: '',
        endereco: '',
        endereco_envio: '',
        categoria_parceiro: 'Fornecedor',
        status: 'Ativo',
        permitir_venda_prazo: false,
      })
    }
    setActiveTab('identificacao')
  }, [item, form, open])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString() : null,
      }

      if (item) await updateParceiro(item.id, payload)
      else await createParceiro(payload)

      toast({ title: 'Salvo com sucesso!' })
      onOpenChange(false)
    } catch (e: any) {
      const errs = extractFieldErrors(e)
      Object.keys(errs).forEach((k) => form.setError(k as any, { message: errs[k] }))
      toast({ title: 'Erro ao salvar parceiro', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Parceiro (CRM)' : 'Novo Parceiro (CRM)'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente ou fornecedor e valide o crédito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="identificacao">Identificação</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="logistica">Logística & Crédito</TabsTrigger>
              </TabsList>

              <div className="mt-4 min-h-[260px]">
                <TabsContent value="identificacao" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="nome_razao_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo / Razão Social *</FormLabel>
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
                      name="tipo_documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Documento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CPF">CPF</SelectItem>
                              <SelectItem value="CNPJ">CNPJ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero_documento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número Documento (CPF/CNPJ)</FormLabel>
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
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG / Inscrição Estadual</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Nascimento / Fundação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contato" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contato_whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp / Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail Principal</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoria_parceiro"
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
                              <SelectItem value="Cliente">Cliente</SelectItem>
                              <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                              <SelectItem value="Funcionário">Funcionário</SelectItem>
                              <SelectItem value="Transportadora">Transportadora</SelectItem>
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
                          <FormLabel>Status Operacional</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'Ativo'}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ativo">Ativo</SelectItem>
                              <SelectItem value="Inativo">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="logistica" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Residencial / Comercial</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco_envio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço de Entrega (Logística)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Mesmo que residencial se vazio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t mt-4">
                    <FormField
                      control={form.control}
                      name="permitir_venda_prazo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-gray-800">
                              Habilitar Venda a Prazo
                            </FormLabel>
                            <p className="text-sm text-gray-500">
                              Exige preenchimento obrigatório de RG e CPF.
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end pt-4 border-t gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" style={{ backgroundColor: '#094016' }}>
                Salvar Parceiro
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
