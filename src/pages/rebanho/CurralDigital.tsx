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
import { Scale, CloudOff } from 'lucide-react'

export default function CurralDigital() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()
  const [animalId, setAnimalId] = useState('')
  const [peso, setPeso] = useState('')

  const handleSave = () => {
    const p = parseFloat(peso)
    if (!animalId || isNaN(p)) return

    const pesagemId = Math.random().toString()
    const now = new Date().toISOString()
    const a = state.animais.find((x) => x.id === animalId)
    if (!a) return

    // Calculate exact days since last weighing
    const lastPesagem = state.pesagens
      .filter((px) => px.animalId === animalId)
      .sort((pa, pb) => new Date(pb.date).getTime() - new Date(pa.date).getTime())[0]

    let daysSinceLast = 30 // fallback
    if (lastPesagem) {
      const diffTime = new Date(now).getTime() - new Date(lastPesagem.date).getTime()
      daysSinceLast = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)))
    }
    const newGmd = (p - a.pesoAtual) / daysSinceLast

    const newPesagem = { id: pesagemId, animalId, weight: p, date: now }

    dispatch((s) => {
      const auditLog = {
        id: Math.random().toString(),
        date: now,
        userName: s.currentUser?.name || 'Operacional',
        action: 'Update' as any,
        table: 'Animais',
        recordId: a.brinco,
        oldValue: `${a.pesoAtual} kg`,
        newValue: `${p} kg`,
      }

      const offlineAction = {
        id: Math.random().toString(),
        type: 'CREATE_PESAGEM',
        payload: { animalId, peso: p },
        timestamp: now,
      }

      return {
        ...s,
        pesagens: [...s.pesagens, newPesagem],
        animais: s.animais.map((x) =>
          x.id === animalId ? { ...x, pesoAtual: p, gmd: newGmd } : x,
        ),
        auditLogs: [auditLog, ...s.auditLogs],
        pendingSyncQueue: s.isOnline ? s.pendingSyncQueue : [...s.pendingSyncQueue, offlineAction],
      }
    })

    // Sincronização Inttegra (Tabela Especificada: Historico_Pesagem)
    pushRecord('Historico_Pesagem', pesagemId, newPesagem)

    toast({
      title: state.isOnline ? 'Pesagem Registrada' : 'Salvo Offline',
      description: state.isOnline
        ? `GMD Atualizado: ${newGmd.toFixed(3)} kg/dia.`
        : 'Será sincronizado automaticamente.',
      className: !state.isOnline ? 'border-amber-500' : '',
    })
    setPeso('')
    setAnimalId('')
  }

  return (
    <div className="flex justify-center sm:pt-6 h-full sm:h-auto">
      <Card className="w-full max-w-md shadow-elevation border-t-4 border-t-emerald-700 rounded-none sm:rounded-xl flex flex-col h-full sm:h-auto border-x-0 border-b-0 sm:border-x sm:border-b">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit mb-4">
            <Scale className="w-10 h-10 text-emerald-800" />
          </div>
          <CardTitle className="text-3xl text-emerald-900 tracking-tight">Curral Digital</CardTitle>
          <p className="text-base text-muted-foreground mt-2">
            Módulo de pesagem otimizado p/ campo.
          </p>
          {!state.isOnline && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md text-sm font-medium">
              <CloudOff className="w-4 h-4" /> Operando Offline
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col pt-4">
          <div className="space-y-3">
            <label className="text-base font-semibold text-emerald-950">
              Selecione o Animal (Brinco)
            </label>
            <Select value={animalId} onValueChange={setAnimalId}>
              <SelectTrigger className="text-xl h-16 rounded-xl bg-slate-50 border-slate-200 shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
                <SelectValue placeholder="Toque para selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {state.animais.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-lg py-3">
                    {a.brinco} - {a.categoria} ({a.pesoAtual}kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-semibold text-emerald-950">Novo Peso (Kg)</label>
            <Input
              type="number"
              className="text-5xl font-mono text-center h-24 text-emerald-900 font-bold rounded-xl bg-slate-50 border-slate-200 shadow-sm focus-visible:ring-emerald-500"
              placeholder="000"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>
          <div className="mt-auto pt-6 pb-8 sm:pb-0">
            <Button
              className="w-full h-16 text-xl font-bold bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
              onClick={handleSave}
            >
              Gravar Pesagem
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
