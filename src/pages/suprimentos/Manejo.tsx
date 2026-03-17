import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
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
import { Droplet } from 'lucide-react'

export default function Manejo() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [form, setForm] = useState({ itemId: '', quantity: '', loteId: '' })

  const handleSave = () => {
    const q = Number(form.quantity)
    if (!form.itemId || isNaN(q) || !form.loteId) return

    dispatch((s) => {
      const item = s.estoque.find((e) => e.id === form.itemId)
      const cost = item ? item.unitCost * q : 0

      return {
        ...s,
        estoque: s.estoque.map((e) =>
          e.id === form.itemId ? { ...e, quantity: e.quantity - q } : e,
        ),
        manejos: [
          ...s.manejos,
          {
            id: Math.random().toString(),
            type: 'Saída para Manejo',
            details: 'Manejo Diário',
            date: new Date().toISOString(),
            loteId: form.loteId,
            cost,
          },
        ],
      }
    })
    toast({ title: 'Manejo registrado!', description: 'Estoque deduzido e custo alocado ao lote.' })
    setForm({ itemId: '', quantity: '', loteId: '' })
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700">
        <CardHeader className="text-center">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-2">
            <Droplet className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl text-emerald-900">Trato Diário / Nutrição</CardTitle>
          <p className="text-sm text-muted-foreground">Registre insumos consumidos por lote.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">Lote Destino</label>
            <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lote..." />
              </SelectTrigger>
              <SelectContent>
                {state.lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.costCenter})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Insumo Utilizado</label>
            <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Insumo..." />
              </SelectTrigger>
              <SelectContent>
                {state.estoque.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.quantity} {e.unit} disp.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Quantidade Utilizada</label>
            <Input
              type="number"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <Button className="w-full mt-4 bg-emerald-800" onClick={handleSave}>
            Confirmar e Alocar Custo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
