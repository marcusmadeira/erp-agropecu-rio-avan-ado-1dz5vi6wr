import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTratoDiarioLotes } from '@/services/trato_diario_lotes'
import { useRealtime } from '@/hooks/use-realtime'

export function ConsumoLotes() {
  const [tratos, setTratos] = useState<any[]>([])

  const loadData = async () => {
    const data = await getTratoDiarioLotes()
    setTratos(data)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('trato_diario_lotes', loadData)

  const lotesConsumo = useMemo(() => {
    const map: Record<string, { nome: string; qtd: number; custo: number }> = {}
    tratos.forEach((t) => {
      const loteId = t.lote_id
      if (!loteId) return
      const nome = t.expand?.lote_id?.nome_lote || 'Lote Deletado/Desconhecido'
      if (!map[loteId]) map[loteId] = { nome, qtd: 0, custo: 0 }
      map[loteId].qtd += t.quantidade_kg_servida || 0
      map[loteId].custo += t.custo_total_trato || 0
    })
    return Object.values(map).sort((a, b) => b.custo - a.custo)
  }, [tratos])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Resumo de Consumo de Ração por Lote</h2>
          <p className="text-slate-500 text-sm">
            Acumulado com base nos tratos diários registrados no sistema.
          </p>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Qtd. Total Consumida (kg)</TableHead>
                <TableHead className="text-right">Custo Total Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotesConsumo.map((l) => (
                <TableRow key={l.nome}>
                  <TableCell className="font-semibold text-slate-800">{l.nome}</TableCell>
                  <TableCell className="text-right font-mono">
                    {l.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg
                  </TableCell>
                  <TableCell className="text-right text-[#094016] font-bold">
                    R${' '}
                    {l.custo.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {lotesConsumo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                    Nenhum consumo registrado no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
