import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft } from 'lucide-react'
import { ToribaLogo } from '@/components/ToribaLogo'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, insira um endereço de e-mail válido.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await pb.send('/backend/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })

      toast({
        title: 'Código Enviado',
        description: 'Verifique sua caixa de entrada com o código de 6 dígitos.',
      })
      setStep(2)
    } catch (error) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'O código deve ter exatamente 6 dígitos.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await pb.send('/backend/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword: password }),
        headers: { 'Content-Type': 'application/json' },
      })

      navigate('/login', {
        state: { message: 'Senha redefinida com sucesso! Faça login com suas novas credenciais' },
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Código inválido ou expirado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-primary animate-fade-in-up">
        <CardHeader className="text-center pb-4 relative">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="absolute left-4 top-4 text-slate-500 hover:text-slate-700"
          >
            <Link to="/login">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <ToribaLogo className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary tracking-tight font-sans">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="font-sans">
            {step === 1
              ? 'Informe seu e-mail para receber o código de verificação'
              : 'Insira o código recebido e sua nova senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-6 font-sans">
              <div className="space-y-2">
                <Label htmlFor="email">Endereço de E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@toriba.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#094016] hover:bg-[#073010] text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação (6 dígitos)</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
                className="w-full bg-[#094016] hover:bg-[#073010] text-white h-12 mt-4"
                disabled={isLoading || !code || !password || !confirmPassword}
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
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary/80 hover:text-primary font-medium font-sans"
            >
              Voltar para Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
