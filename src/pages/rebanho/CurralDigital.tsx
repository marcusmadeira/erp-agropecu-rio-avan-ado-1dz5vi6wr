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
import { Scale } from 'lucide-react'

export default function CurralDigital() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()
  const [animalId, setAnimalId] = useState('')
  const [peso, setPeso] = useState('')

  const handleSave = () => {
    const p = parseFloat(peso)
    if (!animalId || isNaN(p)) return

    dispatch((s) => {
      const a = s.animais.find((x) => x.id === animalId)
      if (!a) return s
      const newGmd = (p - a.pesoAtual) / 30 // mock calculation 30 days
      return {
        ...s,
        pesagens: [
          ...s.pesagens,
          { id: Math.random().toString(), animalId, weight: p, date: new Date().toISOString() },
        ],
        animais: s.animais.map((x) =>
          x.id === animalId ? { ...x, pesoAtual: p, gmd: newGmd } : x,
        ),
      }
    })

    toast({
      title: 'Pesagem registrada com sucesso!',
      description: 'Peso e GMD atualizados automaticamente.',
    })
    setPeso('')
    setAnimalId('')
  }

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700">
        <CardHeader className="text-center">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-2">
            <Scale className="w-8 h-8 text-emerald-800" />
          </div>
          <CardTitle className="text-2xl text-emerald-900">Curral Digital</CardTitle>
          <p className="text-sm text-muted-foreground">Registre a pesagem de forma rápida.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Animal (Brinco)</label>
            <Select value={animalId} onValueChange={setAnimalId}>
              <SelectTrigger className="text-lg h-12">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {state.animais.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.brinco} - {a.categoria} ({a.pesoAtual}kg atual)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Peso (Kg)</label>
            <Input
              type="number"
              className="text-3xl font-mono text-center h-16 text-emerald-900 font-bold"
              placeholder="000"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-14 text-lg bg-emerald-800 hover:bg-emerald-900"
            onClick={handleSave}
          >
            Salvar Pesagem
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
