import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tractor, Loader2 } from 'lucide-react'

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

    // Simulate network delay
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
            role: 3, // Default role for new signups
          },
        ],
      }))

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Faça login com suas novas credenciais para acessar o sistema.',
      })

      setIsLoading(false)
      navigate('/login')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
            <Tractor className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900 tracking-tight">
            Criar Nova Conta
          </CardTitle>
          <CardDescription>Junte-se ao Agro ERP Elite</CardDescription>
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
                placeholder="usuario@agro.com"
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

            <Button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 h-12 mt-2"
              disabled={isLoading}
            >
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
              className="font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
