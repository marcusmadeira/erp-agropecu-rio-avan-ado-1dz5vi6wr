import { Card, CardContent } from '@/components/ui/card'

export default function TabClientesCRM() {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 p-6">
        <p className="text-lg font-medium text-gray-700">Módulo de Clientes CRM</p>
        <p className="text-sm mt-2 text-center max-w-md">
          A interface de CRM está sendo implementada. Em breve você poderá gerenciar o
          relacionamento com seus clientes por aqui.
        </p>
      </CardContent>
    </Card>
  )
}
