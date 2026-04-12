import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { getVenda, getItensVenda } from '@/services/financeiro_vendas'
import ParcelasTab from './components/ParcelasTab'

export default function VendaDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [venda, setVenda] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getVenda(id), getItensVenda(id)])
      .then(([v, i]) => {
        setVenda(v)
        setItens(i)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!venda) {
    return <div className="p-6 text-center text-red-500 font-medium">Venda não encontrada.</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Detalhes da Venda</h1>
        <Badge className="bg-emerald-100 text-emerald-800 border-0">{venda.status_venda}</Badge>
      </div>

      <Tabs defaultValue="financeiro" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-white">
            Resumo da Venda
          </TabsTrigger>
          <TabsTrigger value="itens" className="data-[state=active]:bg-white">
            Itens (Animais)
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-white">
            Financeiro (Boletos)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900">
                  {venda.expand?.cliente_id?.nome_razao_social || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Data da Venda</p>
                <p className="font-semibold text-gray-900">
                  {new Date(venda.data_venda).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                <p className="font-semibold text-lg" style={{ color: '#094016' }}>
                  R$ {venda.valor_total_venda.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Forma de Pagamento</p>
                <p className="font-semibold text-gray-900">{venda.forma_pagamento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Custo Animais</p>
                <p className="font-semibold text-orange-600">
                  R${' '}
                  {itens
                    .reduce(
                      (acc, item) => acc + (item.expand?.animal_id?.custo_variavel_acumulado || 0),
                      0,
                    )
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Margem (Lucro)</p>
                <p className="font-semibold" style={{ color: '#094016' }}>
                  {(() => {
                    const cost = itens.reduce(
                      (acc, item) => acc + (item.expand?.animal_id?.custo_variavel_acumulado || 0),
                      0,
                    )
                    const margin = venda.valor_total_venda - cost
                    const percent =
                      venda.valor_total_venda > 0 ? (margin / venda.valor_total_venda) * 100 : 0
                    return `R$ ${margin.toFixed(2)} (${percent.toFixed(1)}%)`
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens" className="pt-4">
          <Card>
            <CardContent className="p-0 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Animal (Brinco)</th>
                    <th className="p-4 font-semibold text-gray-600">Categoria</th>
                    <th className="p-4 text-right font-semibold text-gray-600">Custo</th>
                    <th className="p-4 text-right font-semibold text-gray-600">Valor Un.</th>
                    <th className="p-4 text-right font-semibold text-gray-600">Desconto</th>
                    <th className="p-4 text-right font-semibold text-gray-600">Valor Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itens.map((item) => {
                    const final = item.valor_unitario - (item.desconto_aplicado || 0)
                    const cost = item.expand?.animal_id?.custo_variavel_acumulado || 0
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">
                          {item.expand?.animal_id?.id_manejo_brinco}
                        </td>
                        <td className="p-4 text-gray-600">{item.expand?.animal_id?.categoria}</td>
                        <td className="p-4 text-right text-orange-600">R$ {cost.toFixed(2)}</td>
                        <td className="p-4 text-right text-gray-600">
                          R$ {item.valor_unitario.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-red-500">
                          {item.desconto_aplicado
                            ? `- R$ ${item.desconto_aplicado.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="p-4 text-right font-bold" style={{ color: '#094016' }}>
                          R$ {final.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                  {itens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        Nenhum animal vinculado a esta venda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="pt-4">
          <ParcelasTab vendaId={venda.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
