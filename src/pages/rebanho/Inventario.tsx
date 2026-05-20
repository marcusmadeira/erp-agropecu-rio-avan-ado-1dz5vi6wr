import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Box, TrendingUp, DollarSign } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export default function Inventario() {
  const [animais, setAnimais] = useState<any[]>([])
  const [estoqueFazenda, setEstoqueFazenda] = useState<any>(null)

  const [precoArroba, setPrecoArroba] = useState<number>(300)

  const load = async () => {
    try {
      const { getActiveHerdMetrics } = await import('@/services/herdService')
      const metrics = await getActiveHerdMetrics()
      const animaisData = await pb.collection('animais').getFullList({
        filter: "status = 'Ativo'",
        expand: 'lote_atual_id',
      })

      setAnimais(animaisData)
      setPrecoArroba(metrics.preco_arroba || 300)
    } catch (error) {
      console.error('Erro ao carregar inventário:', error)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('animais', () => load())
  useRealtime('precos_mercado', () => load())

  const totaisCalculados = useMemo(() => {
    let totalPeso = 0
    let totalArrobas = 0
    animais.forEach((a) => {
      totalPeso += a.peso_atual_kg || 0
      totalArrobas += a.arrobas_atuais || (a.peso_atual_kg || 0) / 15
    })

    if (totalArrobas === 0 && animais.length > 0) {
      totalArrobas = animais.length * 7
    }

    return {
      totalPeso,
      totalArrobas,
      valorEstimado: totalArrobas * precoArroba,
    }
  }, [animais, precoArroba])

  const grouped = useMemo(() => {
    const groups: Record<
      string,
      { lote: string; categoria: string; count: number; total_peso: number; total_arrobas: number }
    > = {}

    animais.forEach((a) => {
      const lote = a.expand?.lote_atual_id?.nome_lote || 'Sem Lote'
      const cat = a.categoria || 'Sem Categoria'
      const key = `${lote}-${cat}`

      if (!groups[key]) {
        groups[key] = { lote, categoria: cat, count: 0, total_peso: 0, total_arrobas: 0 }
      }

      groups[key].count++
      groups[key].total_peso += a.peso_atual_kg || 0
      groups[key].total_arrobas += a.arrobas_atuais || (a.peso_atual_kg || 0) / 15
    })

    return Object.values(groups).sort((a, b) => a.lote.localeCompare(b.lote))
  }, [animais])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventário Geral Consolidado
          </h1>
          <p className="text-sm text-slate-500">Visão em tempo real do rebanho ativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">
              Total de Animais Ativos
            </CardTitle>
            <Box className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{animais.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Total em Arrobas (@)</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totaisCalculados.totalArrobas.toFixed(2)} @
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Peso total: {(totaisCalculados.totalPeso / 1000).toFixed(2)} toneladas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">
              Valor Estimado do Rebanho
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totaisCalculados.valorEstimado,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Composição do Rebanho por Lote</CardTitle>
          <CardDescription>
            Detalhamento de quantidade e peso dos animais agrupados por lote e categoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Peso Total (kg)</TableHead>
                <TableHead className="text-right">Total Arrobas (@)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map((g, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-slate-900">{g.lote}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700">
                      {g.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-700">
                    {g.count}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {g.total_peso.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-slate-600 font-medium">
                    {g.total_arrobas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              {grouped.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum animal ativo encontrado no inventário.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
