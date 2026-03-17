import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mockUsers } from '@/stores/mockData'
import { useToast } from '@/hooks/use-toast'
import { Tractor } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { dispatch } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = (e?: React.FormEvent, mockEmail?: string) => {
    if (e) e.preventDefault()

    const targetEmail = mockEmail || email
    const user = mockUsers.find((u) => u.email === targetEmail)

    if (user && (mockEmail || password === '123')) {
      dispatch((s) => ({
        ...s,
        isAuthenticated: true,
        currentUser: user,
        userRole: user.role,
      }))

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo, ${user.name}`,
      })

      if (user.role === 3) {
        navigate('/manejo')
      } else {
        navigate('/')
      }
    } else {
      toast({
        title: 'Erro de autenticação',
        description: 'Credenciais inválidas.',
        variant: 'destructive',
      })
    }
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
              <label className="text-sm font-medium">E-mail Corporativo</label>
              <Input
                type="email"
                placeholder="usuario@agro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="***"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 h-12">
              Acessar Painel
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium">
              Acessos Rápidos de Demonstração (Senha: 123)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'admin@agro.com')}
                className="text-xs"
              >
                CEO
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'gerente@agro.com')}
                className="text-xs"
              >
                Gerente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLogin(undefined, 'peao@agro.com')}
                className="text-xs"
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
