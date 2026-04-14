import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Info } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSystemConfig } from '@/hooks/use-system-config'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Login() {
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { logoUrl } = useSystemConfig()

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'message' in location.state) {
      toast({
        title: 'Sucesso',
        description: (location.state as { message: string }).message,
      })
      window.history.replaceState({}, document.title)
    }
  }, [location.state, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginOrEmail.trim() || !password.trim()) {
      toast({
        title: 'Validação',
        description: 'Os campos de Email/Login e Senha são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    const { error } = await signIn(loginOrEmail, password)
    setIsLoading(false)

    if (error) {
      toast({
        title: 'Erro de autenticação',
        description: getErrorMessage(error) || 'Usuário ou senha inválidos.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao sistema.',
      })
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#ffffff] p-4"
      style={{ fontFamily: '"Montserrat", "Roboto", sans-serif' }}
    >
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-brand animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src={logoUrl}
              alt="Toriba Agropecuária Logo"
              style={{ width: '120px', height: '120px' }}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-brand tracking-tight">
            Gestão Pecuária 360º
          </CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-brand/30 bg-brand/5">
            <Info className="h-4 w-4 !text-brand" />
            <AlertTitle className="font-bold text-brand">Acesso Rápido</AlertTitle>
            <AlertDescription className="text-brand/90">
              Usuário de teste criado com sucesso! Email: admin@toriba.com | Senha: admin123
            </AlertDescription>
          </Alert>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="loginOrEmail" className="font-bold text-slate-700">
                Email ou Login
              </Label>
              <Input
                id="loginOrEmail"
                type="text"
                placeholder="usuario@toriba.com ou joao.silva"
                value={loginOrEmail}
                onChange={(e) => setLoginOrEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-bold text-slate-700">
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="***"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-brand hover:text-brand/80 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-white h-12 font-bold text-lg border border-brand hover:border-brand"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
