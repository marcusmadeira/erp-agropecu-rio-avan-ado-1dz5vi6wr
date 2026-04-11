import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
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
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { useSystemConfig } from '@/hooks/use-system-config'

const formSchema = z
  .object({
    name: z.string().min(1, 'O Nome Completo é obrigatório'),
    username: z
      .string()
      .min(1, 'O Login é obrigatório')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underline'),
    email: z.string().email('Insira um e-mail válido'),
    confirmEmail: z.string().email('Insira um e-mail válido'),
    phone: z
      .string()
      .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato: (XX) 9XXXX-XXXX')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'A confirmação deve ter no mínimo 6 caracteres'),
    nivel_acesso: z.enum(['Gerente', 'Financeiro', 'Operacional'], {
      required_error: 'Selecione um nível de acesso',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Os emails não conferem',
    path: ['confirmEmail'],
  })

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { logoUrl } = useSystemConfig()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      confirmEmail: '',
      phone: '',
      password: '',
      confirmPassword: '',
      nivel_acesso: undefined,
    },
  })

  const formatPhone = (value: string) => {
    if (!value) return value
    const phone = value.replace(/\D/g, '')
    if (phone.length < 3) return phone
    if (phone.length < 8) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      await pb.collection('users').create({
        name: values.name,
        email: values.email,
        username: values.username,
        password: values.password,
        passwordConfirm: values.confirmPassword,
        phone: values.phone,
        nivel_acesso: values.nivel_acesso,
      })

      toast({
        title: 'Cadastro realizado!',
        description: 'Redirecionando para as instruções...',
      })
      navigate('/confirmacao-email', { replace: true, state: { email: values.email } })
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, { type: 'manual', message })
        })
      } else {
        toast({
          title: 'Erro no cadastro',
          description: getErrorMessage(error),
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#ffffff] p-4"
      style={{ fontFamily: '"Montserrat", "Roboto", sans-serif' }}
    >
      <Card className="w-full max-w-2xl shadow-lg border-t-4 border-t-[#094016] animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src={logoUrl}
              alt="Toriba Agropecuária Logo"
              style={{ width: '100px', height: '100px' }}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#094016] tracking-tight">
            Criar Nova Conta
          </CardTitle>
          <CardDescription>Cadastre-se para acessar o ERP Toriba</CardDescription>
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
                      <FormLabel className="font-bold text-slate-700">Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
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
                      <FormLabel className="font-bold text-slate-700">Login *</FormLabel>
                      <FormControl>
                        <Input placeholder="joao.silva" {...field} />
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
                      <FormLabel className="font-bold text-slate-700">Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@toriba.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Confirmar Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@toriba.com" {...field} />
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
                      <FormLabel className="font-bold text-slate-700">Senha *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Confirmar Senha *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(XX) 9XXXX-XXXX"
                          {...field}
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
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
                      <FormLabel className="font-bold text-slate-700">Nível de Acesso *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Financeiro">Financeiro</SelectItem>
                          <SelectItem value="Operacional">Operacional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white h-12 mt-6 font-bold text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm border-t pt-4 border-slate-100">
            <span className="text-slate-500 font-medium">Já tem uma conta? </span>
            <Link
              to="/login"
              className="font-bold text-[#094016] hover:text-[#094016]/80 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
