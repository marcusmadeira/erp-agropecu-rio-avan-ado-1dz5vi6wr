import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSimulacoes } from '@/services/simulacoes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function ComparativoTab() {
  const [sims, setSims] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(['', '', ''])

  useEffect(() => {
    getSimulacoes().then(setSims)
  }, [])

  const handleSelect = (idx: number, id: string) => {
    const newSel = [...selectedIds]
    newSel[idx] = id
    setSelectedIds(newSel)
  }

  const selectedSims = selectedIds.map((id) => sims.find((s) => s.id === id) || null)

  const formatMoney = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const recalcIncremental = (s: any) => {
    if (!s) return 0
    const lucro_hoje =
      (s.peso_entrada / 15) * s.quantidade_animais * s.preco_venda -
      (s.peso_entrada / 15) * s.quantidade_animais * s.preco_compra
    return s.lucro_bruto - lucro_hoje
  }

  const recalcROI = (s: any) => {
    if (!s) return 0
    return s.custo_total > 0 ? (s.lucro_bruto / s.custo_total) * 100 : 0
  }

  const getBestIndex = () => {
    let bestIdx = -1
    let maxLucro = -Infinity
    selectedSims.forEach((s, i) => {
      if (s && s.lucro_bruto > maxLucro) {
        maxLucro = s.lucro_bruto
        bestIdx = i
      }
    })
    return bestIdx
  }

  const bestIdx = getBestIndex()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Cenários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="font-bold pt-10 text-right pr-4">Selecione o cenário:</div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Select value={selectedIds[i]} onValueChange={(v) => handleSelect(i, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {sims.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.tipo_operacao} ({s.quantidade_animais} cab) -{' '}
                      {new Date(s.created).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bestIdx === i && selectedSims[i] && (
                <Badge className="bg-[#094016] w-full justify-center">Maior Lucro Bruto</Badge>
              )}
            </div>
          ))}
        </div>

        <div className="border rounded-md divide-y overflow-hidden">
          {[
            { label: 'Operação', key: 'tipo_operacao' },
            { label: 'Animais (cab)', key: 'quantidade_animais' },
            { label: 'GMD Estimado', key: 'gmd_estimado', fmt: (v: number) => `${v} kg/dia` },
            { label: 'Dias Duração', key: 'dias_duracao' },
            { label: 'Peso Final', key: 'peso_final', fmt: (v: number) => `${v?.toFixed(1)} kg` },
            { label: 'Custo Total', key: 'custo_total', fmt: formatMoney },
            { label: 'Receita Total', key: 'receita_total', fmt: formatMoney },
            { label: 'Lucro Bruto Projetado', key: 'lucro_bruto', fmt: formatMoney },
            { label: 'Resultado Incremental', key: 'incremental', fmt: formatMoney },
            {
              label: 'Margem de Lucro',
              key: 'margem_lucro',
              fmt: (v: number) => `${v?.toFixed(2)}%`,
            },
            {
              label: 'ROI Projetado',
              key: 'roi',
              fmt: (v: number) => `${v?.toFixed(2)}%`,
            },
          ].map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium text-right pr-4 text-slate-700">{row.label}</div>
              {[0, 1, 2].map((i) => {
                const s = selectedSims[i]

                let val = s ? s[row.key] : undefined
                if (row.key === 'incremental' && s) {
                  val = recalcIncremental(s)
                }
                if (row.key === 'roi' && s) {
                  val = recalcROI(s)
                }

                return (
                  <div
                    key={i}
                    className={
                      bestIdx === i && (row.key === 'lucro_bruto' || row.key === 'incremental')
                        ? 'font-bold text-[#094016]'
                        : 'text-slate-900'
                    }
                  >
                    {val !== undefined ? (row.fmt ? row.fmt(val) : val) : '-'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
