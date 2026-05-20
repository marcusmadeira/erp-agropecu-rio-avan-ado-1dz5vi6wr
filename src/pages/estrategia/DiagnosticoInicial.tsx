import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DiagnosticoInicial() {
  const [data, setData] = useState({ totalAnimais: 0, arrobas: 0 })

  useEffect(() => {
    pb.collection('animais')
      .getFullList({ filter: "status != 'Vendido' && status != 'Morto'" })
      .then((animais) => {
        const totalArrobas = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0) / 30, 0)
        setData({ totalAnimais: animais.length, arrobas: totalArrobas })
      })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-emerald-900">Diagnóstico Inicial do Rebanho</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Cabeças (Ativas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{data.totalAnimais}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Arrobas Estimadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{data.arrobas.toFixed(2)} @</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
