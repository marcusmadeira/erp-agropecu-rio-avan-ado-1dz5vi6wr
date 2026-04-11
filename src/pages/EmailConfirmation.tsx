import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useToast } from '@/hooks/use-toast'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function EmailConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState(location.state?.email || '')
  const [isEmailSet, setIsEmailSet] = useState(!!location.state?.email)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    try {
      await pb.send('/backend/v1/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        headers: { 'Content-Type': 'application/json' },
      })

      toast({
        title: 'Sucesso!',
        description: 'Email confirmado com sucesso! Faça login com suas credenciais',
      })
      navigate('/login')
    } catch (error: any) {
      toast({
        title: 'Código inválido',
        description: 'O código inserido está incorreto ou expirou.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    try {
      await pb.send('/backend/v1/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({
        title: 'Código reenviado',
        description: 'Verifique sua caixa de entrada e pasta de spam.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar',
        description: error?.response?.message || 'Ocorreu um erro ao enviar o código.',
        variant: 'destructive',
      })
    } finally {
      setResending(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsEmailSet(true)
      handleResend()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      style={{ fontFamily: '"Montserrat", "Roboto", sans-serif' }}
    >
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-[#094016] animate-fade-in-up text-center">
        {!isEmailSet ? (
          <>
            <CardHeader>
              <div className="mx-auto bg-green-50 p-3 rounded-full w-fit mb-4">
                <Mail className="w-12 h-12 text-[#094016]" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#094016]">
                Confirme seu Email
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Para prosseguir com a ativação, precisamos saber o endereço de email cadastrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2 text-left">
                  <Input
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white font-bold h-12"
                >
                  Continuar
                </Button>
                <div className="pt-4 text-center">
                  <Button variant="link" asChild className="text-slate-500 hover:text-slate-800">
                    <Link to="/login">Voltar para o Login</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="mx-auto bg-green-50 p-3 rounded-full w-fit mb-4">
                <CheckCircle2 className="w-12 h-12 text-[#094016]" />
              </div>
              <CardTitle className="text-2xl font-bold text-[#094016]">
                Verifique seu email para confirmar seu cadastro
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Enviamos um código para: <br />
                <span className="font-semibold text-slate-800">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white font-bold h-12"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Confirmar
                </Button>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#094016] hover:text-[#094016]/80 hover:bg-green-50 font-semibold"
                  >
                    {resending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Reenviar Código
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsEmailSet(false)}
                    className="text-slate-500 hover:text-slate-800 text-sm"
                  >
                    Usar outro email
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
