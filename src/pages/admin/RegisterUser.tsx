import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus, ShieldAlert } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
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
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

const formSchema = z.object({
  name: z.string().min(1, 'O Nome Completo é obrigatório'),
  username: z
    .string()
    .min(1, 'O Login é obrigatório')
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underline'),
  email: z.string().email('Insira um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  nivel_acesso: z.enum(['Gerente', 'Financeiro', 'Operacional'], {
    required_error: 'Selecione um nível de acesso',
  }),
  role: z.enum(['Admin', 'Operacional'], { required_error: 'Selecione uma role' }),
  status_usuario: z.enum(['Ativo', 'Inativo'], { required_error: 'Selecione um status' }),
})

export default function RegisterUser() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { signUp } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      nivel_acesso: 'Operacional',
      role: 'Operacional',
      status_usuario: 'Ativo',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    const { error } = await signUp({
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
      role: values.role,
      nivel_acesso: values.nivel_acesso,
      status_usuario: values.status_usuario,
    })
    setIsLoading(false)

    if (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, { type: 'manual', message })
        })
      } else {
        toast({
          title: 'Erro ao criar usuário',
          description: getErrorMessage(error),
          variant: 'destructive',
        })
      }
      return
    }

    toast({
      title: 'Usuário Criado',
      description: 'A conta foi criada com sucesso e já pode ser utilizada.',
    })
    form.reset()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Gerenciamento de acessos e contas do sistema
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-md border-t-4 border-t-emerald-600">
            <CardHeader>
              <CardTitle>Dados do Usuário</CardTitle>
              <CardDescription>
                Preencha as informações para registrar um novo colaborador com acesso imediato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João Silva" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@toriba.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login</FormLabel>
                          <FormControl>
                            <Input placeholder="joao.silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha (Mín. 8 caracteres)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nivel_acesso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil de Acesso</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val)
                              form.setValue('role', val === 'Operacional' ? 'Operacional' : 'Admin')
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Gerente">Gerente / Administração</SelectItem>
                              <SelectItem value="Financeiro">Financeiro</SelectItem>
                              <SelectItem value="Operacional">Operacional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status_usuario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
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
                  <Button
                    type="submit"
                    className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                      </>
                    ) : (
                      'Salvar Usuário'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="shadow-md bg-slate-50 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Permissões (RBAC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Admin</h4>
                <p>
                  Acesso total a todos os módulos do ERP, incluindo Financeiro, Relatórios
                  Estratégicos, Auditoria e Gerenciamento de Usuários.
                </p>
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-bold text-slate-800 mb-1">Operacional</h4>
                <p>
                  Acesso restrito. Visualização e modificação permitida apenas nos módulos: Animais,
                  Lotes, Pastos, Apartação, Reprodução, Pesagem, Clima, Mercado, Receitas de Ração,
                  Produção de Ração e Saída de Ração. O restante do sistema fica oculto e bloqueado.
                </p>
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-bold text-slate-800 mb-1">Acesso Direto</h4>
                <p>
                  Usuários criados por administradores não necessitam de confirmação de e-mail e
                  podem realizar login imediatamente no sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
