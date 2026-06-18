import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SolicitarAcesso() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    try {
      await pb.collection('users').create({
        email: fd.get('email'),
        password: fd.get('password'),
        passwordConfirm: fd.get('password'),
        name: `${fd.get('nome')} ${fd.get('sobrenome')}`,
        phone: fd.get('cpf'),
        role: fd.get('role'),
        status_usuario: 'Inativo',
      })

      toast({
        title: 'Solicitação enviada!',
        description: 'Sua conta está aguardando aprovação pelos administradores.',
      })
      navigate('/aguardando-aprovacao')
    } catch (err: any) {
      toast({ title: 'Erro na solicitação', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div>
          <h2 className="mt-6 text-center text-4xl font-serif text-[#10213d]">Toriba Premium</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Solicite acesso ao Command Center da Fazenda
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input id="sobrenome" name="sobrenome" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Corporativo</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF / Documento</Label>
            <Input id="cpf" name="cpf" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil Desejado</Label>
            <Select name="role" defaultValue="Operacional">
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Administrador</SelectItem>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#10213d] hover:bg-[#1a2f4d] text-white"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Solicitar Acesso'}
          </Button>

          <div className="text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
