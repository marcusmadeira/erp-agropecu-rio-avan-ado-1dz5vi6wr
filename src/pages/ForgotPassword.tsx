import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tractor, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email')
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, preencha o campo de contato.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      const methodLabel = method === 'email' ? 'E-mail' : 'WhatsApp'
      toast({
        title: 'Recuperação Solicitada',
        description: `Link de recuperação enviado com sucesso via ${methodLabel}.`,
      })
      // For demonstration purposes, we navigate to the reset page
      // In a real app, the user would click the link in their email/whatsapp
      navigate('/reset-password')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 animate-fade-in-up">
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
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
            <Tractor className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900 tracking-tight">
            Recuperar Senha
          </CardTitle>
          <CardDescription>Escolha como deseja receber o link de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecover} className="space-y-6">
            <RadioGroup
              value={method}
              onValueChange={(value: 'email' | 'whatsapp') => setMethod(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="email" id="r-email" />
                <Label htmlFor="r-email" className="cursor-pointer flex-1">
                  E-mail
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="whatsapp" id="r-whatsapp" />
                <Label htmlFor="r-whatsapp" className="cursor-pointer flex-1">
                  WhatsApp
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="contact">
                {method === 'email' ? 'Endereço de E-mail' : 'Número de WhatsApp'}
              </Label>
              <Input
                id="contact"
                type={method === 'email' ? 'email' : 'tel'}
                placeholder={method === 'email' ? 'usuario@agro.com' : '(00) 00000-0000'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
