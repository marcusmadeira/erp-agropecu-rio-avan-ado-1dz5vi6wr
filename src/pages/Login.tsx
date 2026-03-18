import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tractor, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = (e?: React.FormEvent, mockEmail?: string) => {
    if (e) e.preventDefault()
    setIsLoading(true)

    // Simulate network delay for better UX
    setTimeout(() => {
      const targetEmail = mockEmail || email

      // Fallback to empty array if state.users is undefined from older local storage
      const userList = state.users || []

      let user = userList.find((u) => u.email === targetEmail)

      // Admin default override
      if (targetEmail === 'adm' && password === 'adm123') {
        user = {
          id: 'admin-1',
          email: 'adm',
          name: 'Administrador (Super)',
          role: 1,
          password: 'adm123',
        }
      }

      let isValidPassword = false
      if (user) {
        if (targetEmail === 'adm' && password === 'adm123') isValidPassword = true
        else if (mockEmail)
          isValidPassword = true // Auto-login buttons
        else if (user.password && user.password === password) isValidPassword = true
        else if (!user.password && password === '123') isValidPassword = true // Fallback for old mock data
      }

      if (user && isValidPassword) {
        dispatch((s) => ({
          ...s,
          isAuthenticated: true,
          currentUser: user,
          userRole: user!.role,
        }))

        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission()
        }

        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${user.name}`,
        })

        if (user.role === 3) {
          navigate('/manejo', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } else {
        toast({
          title: 'Erro de autenticação',
          description: 'Usuário ou senha inválidos.',
          variant: 'destructive',
        })
      }
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
            <Tractor className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900 tracking-tight">
            Agro ERP Elite
          </CardTitle>
          <CardDescription>Acesso Seguro ao Sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário ou E-mail</Label>
              <Input
                id="email"
                type="text"
                placeholder="adm ou usuario@agro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="***"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Acessar Painel'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link
              to="/register"
              className="font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              Cadastrar-se
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium">
              Acessos Rápidos de Demonstração (Senha: 123)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'admin@agro.com')}
                className="text-xs"
                disabled={isLoading}
              >
                CEO
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'gerente@agro.com')}
                className="text-xs"
                disabled={isLoading}
              >
                Gerente
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'peao@agro.com')}
                className="text-xs"
                disabled={isLoading}
              >
                Operação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
