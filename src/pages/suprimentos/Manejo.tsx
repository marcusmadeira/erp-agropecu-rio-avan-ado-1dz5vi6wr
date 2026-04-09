import { useState, useEffect } from 'react'
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
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Manejo() {
  const { toast } = useToast()
  const [form, setForm] = useState({ formId: '', quantity: '', loteId: '' })
  const [lotes, setLotes] = useState<any[]>([])
  const [formulacoes, setFormulacoes] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [lRes, fRes] = await Promise.all([
        pb.collection('lotes').getFullList(),
        pb.collection('formulacoes_racao').getFullList(),
      ])
      setLotes(lRes)
      setFormulacoes(fRes)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lotes', loadData)
  useRealtime('formulacoes_racao', loadData)

  const handleSave = async () => {
    const q = Number(form.quantity)
    if (!form.formId || isNaN(q) || !form.loteId) return

    try {
      await pb.collection('trato_diario_lotes').create({
        data: new Date().toISOString(),
        lote_id: form.loteId,
        formulacao_id: form.formId,
        quantidade_kg_servida: q,
        custo_total_trato: 100, // Example cost, normally calculated on backend hook
      })
      toast({
        title: 'Manejo registrado!',
        description: 'Insumos deduzidos e custos distribuídos no lote.',
      })
      setForm({ formId: '', quantity: '', loteId: '' })
    } catch (e) {
      toast({ title: 'Erro ao salvar manejo', variant: 'destructive' })
    }
  }

  return (
    <div className="flex justify-center sm:pt-6 h-full sm:h-auto">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-[#094016] rounded-none sm:rounded-xl flex flex-col h-full sm:h-auto">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-[#094016]/10 p-4 rounded-full w-fit mb-4">
            <Droplet className="w-10 h-10 text-[#094016]" />
          </div>
          <CardTitle className="text-3xl text-[#094016] tracking-tight">Trato Diário</CardTitle>
          <p className="text-base text-muted-foreground mt-2">Apontamento rápido no campo.</p>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col pt-2">
          <div className="space-y-3">
            <label className="text-base font-semibold text-slate-800">Lote Destino</label>
            <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
              <SelectTrigger className="text-lg h-14 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione o Lote..." />
              </SelectTrigger>
              <SelectContent>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-lg py-3">
                    {l.nome_lote} ({l.quantidade_cabecas || 0} cab)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-semibold text-slate-800">Formulação (Dieta)</label>
            <Select value={form.formId} onValueChange={(v) => setForm({ ...form, formId: v })}>
              <SelectTrigger className="text-lg h-14 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecione a Dieta..." />
              </SelectTrigger>
              <SelectContent>
                {formulacoes.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-lg py-3">
                    {f.nome_formulacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-base font-semibold text-slate-800">Quantidade (Kg)</label>
            <Input
              type="number"
              placeholder="0"
              className="text-3xl font-mono text-center h-20 text-[#094016] font-bold rounded-xl bg-slate-50 border-slate-200"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="mt-auto pt-6 pb-8 sm:pb-0">
            <Button
              className="w-full h-16 text-xl font-bold bg-[#094016] hover:bg-[#094016]/90 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
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
