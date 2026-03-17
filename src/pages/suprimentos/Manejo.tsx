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
  const [form, setForm] = useState({ itemId: '', quantity: '' })

  const handleSave = () => {
    const q = Number(form.quantity)
    if (!form.itemId || isNaN(q)) return

    dispatch((s) => ({
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
        },
      ],
    }))
    toast({ title: 'Manejo registrado!', description: 'Estoque deduzido automaticamente.' })
    setForm({ itemId: '', quantity: '' })
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700">
        <CardHeader className="text-center">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-2">
            <Droplet className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl text-emerald-900">Manejo Diário</CardTitle>
          <p className="text-sm text-muted-foreground">Registre o uso de insumos.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Insumo Utilizado</label>
            <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {state.estoque.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.quantity} disp.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantidade Utilizada</label>
            <Input
              type="number"
              className="h-12"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <Button className="w-full h-12 text-lg bg-emerald-800" onClick={handleSave}>
            Confirmar e Baixar Estoque
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
