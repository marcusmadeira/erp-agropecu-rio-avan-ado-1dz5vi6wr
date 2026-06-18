import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export default function AguardandoAprovacao() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif text-[#10213d] mb-2">Acesso Pendente</h1>
        <p className="text-slate-600 mb-8">
          Sua solicitação de acesso ao Toriba Premium está em análise pelos administradores. Você
          receberá uma notificação quando seu perfil for liberado.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Voltar para o Login</Link>
        </Button>
      </div>
    </div>
  )
}
