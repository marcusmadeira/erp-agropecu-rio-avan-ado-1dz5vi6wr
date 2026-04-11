import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function EmailConfirmation() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      style={{ fontFamily: '"Montserrat", "Roboto", sans-serif' }}
    >
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-[#094016] animate-fade-in-up text-center">
        <CardHeader>
          <div className="mx-auto bg-green-50 p-3 rounded-full w-fit mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#094016]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#094016]">Conta Criada!</CardTitle>
          <CardDescription className="text-base mt-2">
            Um link de confirmação foi enviado para o seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-600">
            Por favor, verifique sua caixa de entrada (e a pasta de spam) e clique no link para
            ativar sua conta antes de fazer o login no sistema.
          </p>
          <Button
            asChild
            className="w-full bg-[#094016] hover:bg-[#094016]/90 text-white h-12 font-bold"
          >
            <Link to="/login">Ir para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
