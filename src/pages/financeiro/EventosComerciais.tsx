import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { useInttegraSync } from '@/hooks/useInttegraSync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function EventosComerciais() {
  const { dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [form, setForm] = useState({ desc: '', value: '', parcels: '1', cc: 'CC02-TIP' })

  const handleSave = () => {
    const v = parseFloat(form.value)
    const p = parseInt(form.parcels)
    if (!form.desc || isNaN(v) || isNaN(p)) return

    const newTxs: any[] = []
    const valPerParcel = v / p
    for (let i = 0; i < p; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      newTxs.push({
        id: Math.random().toString(),
        description: `${form.desc} - Parcela ${i + 1}/${p}`,
        value: valPerParcel,
        type: 'Receita',
        date: d.toISOString(),
        costCenter: form.cc,
        status: i === 0 ? 'Pago' : 'Pendente',
      })
    }

    dispatch((s) => ({ ...s, transacoes: [...s.transacoes, ...newTxs] }))

    // Sync Inttegra para cada transação (Financeiro_Transacoes)
    newTxs.forEach((tx) => {
      pushRecord('Financeiro_Transacoes', tx.id, tx)
    })

    toast({
      title: 'Evento Comercial Registrado',
      description: `${p} transações geradas e sincronização solicitada.`,
    })
    setForm({ desc: '', value: '', parcels: '1', cc: 'CC02-TIP' })
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-lg shadow-elevation border-t-4 border-t-emerald-700">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-900">
            Registrar Venda (Leilão/Frigorífico)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema fará o split automático das parcelas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Descrição da Venda (Ex: Lote Machos Frigorífico)"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Valor Total (R$)"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <div className="flex gap-4">
            <div className="w-1/2 space-y-1">
              <label className="text-xs">Centro de Custo</label>
              <Select value={form.cc} onValueChange={(v) => setForm({ ...form, cc: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC01-PO">PO</SelectItem>
                  <SelectItem value="CC02-TIP">TIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2 space-y-1">
              <label className="text-xs">Número de Parcelas</label>
              <Select value={form.parcels} onValueChange={(v) => setForm({ ...form, parcels: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">À Vista (1x)</SelectItem>
                  <SelectItem value="3">3 Meses (3x)</SelectItem>
                  <SelectItem value="12">12 Meses (12x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full h-12 bg-emerald-800 mt-4" onClick={handleSave}>
            Gerar Lançamentos Financeiros
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
