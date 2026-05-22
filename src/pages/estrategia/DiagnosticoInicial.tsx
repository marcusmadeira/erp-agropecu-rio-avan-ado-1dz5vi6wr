import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DiagnosticoInicial() {
  const [data, setData] = useState({ totalAnimais: 0, arrobas: 0 })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('animais')
      .getFullList({ filter: "status != 'Vendido' && status != 'Morto'" })
      .then((animais) => {
        const totalArrobas = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0) / 30, 0)
        setData({ totalAnimais: animais.length, arrobas: totalArrobas })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando diagnóstico...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
        Diagnóstico Inicial do Rebanho
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total de Cabeças (Ativas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-700">{data.totalAnimais}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total de Arrobas Estimadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-700">{data.arrobas.toFixed(2)} @</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Média por Cabeça</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">
              {data.totalAnimais ? (data.arrobas / data.totalAnimais).toFixed(2) : 0} @
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
