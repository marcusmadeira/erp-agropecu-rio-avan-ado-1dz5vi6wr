import { Card, CardContent } from '@/components/ui/card'

export default function TabOperacoes() {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 p-6">
        <p className="text-lg font-medium text-gray-700">Módulo de Operações de Venda</p>
        <p className="text-sm mt-2 text-center max-w-md">
          A interface de operações de venda está sendo implementada. Em breve você poderá gerenciar
          todas as vendas de forma detalhada por aqui.
        </p>
      </CardContent>
    </Card>
  )
}
