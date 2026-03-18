import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tractor, Loader2 } from 'lucide-react'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas incompatíveis',
        description: 'As senhas informadas não coincidem. Tente novamente.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Senha Redefinida!',
        description: 'Sua senha foi alterada com sucesso. Faça login para continuar.',
      })
      navigate('/login')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
            <Tractor className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900 tracking-tight">
            Criar Nova Senha
          </CardTitle>
          <CardDescription>Defina sua nova credencial de acesso seguro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 h-12 mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
            >
              Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
