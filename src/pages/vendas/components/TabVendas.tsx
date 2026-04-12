import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Activity, ArrowRight } from 'lucide-react'

export default function TabVendas() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="bg-emerald-50 p-6 rounded-full" style={{ color: '#094016' }}>
        <Activity className="w-16 h-16" />
      </div>
      <h2 className="text-2xl font-bold" style={{ color: '#094016' }}>
        Novo Módulo de Vendas
      </h2>
      <p className="text-gray-600 text-center max-w-md">
        A gestão de vendas agora possui um painel avançado com dashboard de análise, relatórios de
        rentabilidade e controle detalhado de parcelas em uma página dedicada.
      </p>
      <Button
        asChild
        className="text-white mt-6 px-8 shadow-md"
        style={{ backgroundColor: '#094016' }}
      >
        <Link to="/vendas/geral">
          Acessar Gestão Completa <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </div>
  )
}
