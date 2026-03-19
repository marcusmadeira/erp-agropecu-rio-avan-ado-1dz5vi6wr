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
import { Droplet, CloudOff } from 'lucide-react'

export default function Manejo() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [form, setForm] = useState({ itemId: '', quantity: '', loteId: '' })

  const handleSave = () => {
    const q = Number(form.quantity)
    if (!form.itemId || isNaN(q) || !form.loteId) return

    const manejoId = Math.random().toString()
    const now = new Date().toISOString()
    const item = state.estoque.find((e) => e.id === form.itemId)
    const cost = item ? item.unitCost * q : 0

    const newManejo = {
      id: manejoId,
      type: 'Saída para Manejo',
      details: 'Manejo Diário',
      date: now,
      loteId: form.loteId,
      itemId: form.itemId,
      quantity: q,
      cost,
    }

    dispatch((s) => {
      const offlineAction = {
        id: Math.random().toString(),
        type: 'CREATE_MANEJO',
        payload: { ...form, cost },
        timestamp: now,
      }

      return {
        ...s,
        estoque: s.estoque.map((e) =>
          e.id === form.itemId ? { ...e, quantity: e.quantity - q } : e,
        ),
        manejos: [...s.manejos, newManejo],
        pendingSyncQueue: s.isOnline ? s.pendingSyncQueue : [...s.pendingSyncQueue, offlineAction],
      }
    })

    // Sincronização Inttegra (Tabela Especificada: Manejo_Diario_Cocho_Sanidade)
    pushRecord('Manejo_Diario_Cocho_Sanidade', manejoId, newManejo)

    toast({
      title: state.isOnline ? 'Manejo registrado!' : 'Salvo Offline',
      description: state.isOnline
        ? 'Estoque deduzido e sincronizado com Inttegra.'
        : 'Aguardando rede para sincronizar.',
    })
    setForm({ itemId: '', quantity: '', loteId: '' })
  }

  return (
    <div className="flex justify-center sm:pt-6 h-full sm:h-auto">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 rounded-none sm:rounded-xl flex flex-col h-full sm:h-auto border-x-0 border-b-0 sm:border-x sm:border-b">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit mb-4">
            <Droplet className="w-10 h-10 text-emerald-800" />
          </div>
          <CardTitle className="text-3xl text-emerald-900 tracking-tight">Trato Diário</CardTitle>
          <p className="text-base text-muted-foreground mt-2">Apontamento rápido no campo.</p>
          {!state.isOnline && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md text-sm font-medium">
              <CloudOff className="w-4 h-4" /> Cache Local Ativo
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col pt-2">
          <div className="space-y-3">
            <label className="text-base font-semibold text-emerald-950">Lote Destino</label>
            <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
              <SelectTrigger className="text-lg h-14 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o Lote..." />
              </SelectTrigger>
              <SelectContent>
                {state.lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-lg py-3">
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-semibold text-emerald-950">Insumo Utilizado</label>
            <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
              <SelectTrigger className="text-lg h-14 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o Insumo..." />
              </SelectTrigger>
              <SelectContent>
                {state.estoque.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-lg py-3">
                    {e.name} ({e.quantity} {e.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-semibold text-emerald-950">Quantidade</label>
            <Input
              type="number"
              placeholder="0"
              className="text-3xl font-mono text-center h-20 text-emerald-900 font-bold rounded-xl bg-slate-50 border-slate-200"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="mt-auto pt-6 pb-8 sm:pb-0">
            <Button
              className="w-full h-16 text-xl font-bold bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
              onClick={handleSave}
            >
              Confirmar e Alocar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
