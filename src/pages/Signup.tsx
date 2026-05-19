import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signUp({ name, email, password, role: 'Operacional' })
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível criar a conta',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      })
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#094016]">Criar Conta</h1>
          <p className="text-slate-500 mt-2">Cadastre-se para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#094016] hover:bg-[#094016]/90"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cadastrar
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-[#094016] hover:underline font-medium">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
