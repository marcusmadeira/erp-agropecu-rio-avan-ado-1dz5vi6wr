import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { ToribaLogo } from '@/components/ToribaLogo'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { dispatch } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos do formulário.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem. Tente novamente.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      dispatch((s) => ({
        ...s,
        users: [
          ...(s.users || []),
          {
            id: Math.random().toString(),
            name,
            email,
            password,
            role: 3,
          },
        ],
      }))

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Faça login com suas novas credenciais para acessar o sistema.',
      })

      setIsLoading(false)
      navigate('/login', { replace: true })
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-primary animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <ToribaLogo className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary tracking-tight">
            Criar Nova Conta
          </CardTitle>
          <CardDescription>Junte-se à Toriba Agropecuária</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Usuário</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@toriba.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-primary h-12 mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tenho uma conta. </span>
            <Link
              to="/login"
              className="font-medium text-primary/80 hover:text-primary transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
