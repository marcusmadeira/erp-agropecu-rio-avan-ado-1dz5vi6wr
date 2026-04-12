import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createReclassificacao, getReclassificacoesByAnimal } from '@/services/reclassificacao'
import { updateAnimal } from '@/services/animais'
import { getLotes } from '@/services/lotes'
import { format, parseISO } from 'date-fns'

export function AnimalReclassificacao({
  animal,
  onReclassified,
}: {
  animal: any
  onReclassified: () => void
}) {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    novaCategoria: animal.categoria || '',
    loteDestino: '',
    motivo: '',
  })

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() => {})
    loadHistory()
  }, [animal.id])

  const loadHistory = async () => {
    try {
      const data = await getReclassificacoesByAnimal(animal.id)
      setHistory(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!form.novaCategoria || !form.loteDestino || !form.motivo) {
      toast({ title: 'Aviso', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await createReclassificacao({
        data: new Date().toISOString(),
        animal_id: animal.id,
        nova_categoria: form.novaCategoria,
        novo_lote_destino_id: form.loteDestino,
        motivo: form.motivo,
      })
      await updateAnimal(animal.id, {
        categoria: form.novaCategoria,
        lote_atual: form.loteDestino,
      })
      toast({ title: 'Sucesso', description: 'Animal reclassificado com sucesso.' })
      setForm({ novaCategoria: '', loteDestino: '', motivo: '' })
      loadHistory()
      onReclassified()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao reclassificar.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentação / Reclassificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Categoria</Label>
            <Select
              value={form.novaCategoria}
              onValueChange={(v) => setForm({ ...form, novaCategoria: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {[
                  'Matriz PO',
                  'Touro PO',
                  'Bezerro',
                  'Novilha TIP',
                  'Garrote TIP',
                  'Vaca Descarte TIP',
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lote Destino</Label>
            <Select
              value={form.loteDestino}
              onValueChange={(v) => setForm({ ...form, loteDestino: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lote..." />
              </SelectTrigger>
              <SelectContent>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo / Justificativa</Label>
            <Textarea
              placeholder="Ex: Baixo ganho de peso, descarte reprodutivo..."
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#094016] text-white hover:bg-[#094016]/90"
          >
            Confirmar Reclassificação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reclassificação</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum histórico registrado.</p>
          ) : (
            <div className="space-y-4">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="border-l-4 border-[#094016] pl-4 py-2 bg-slate-50 rounded-r-md"
                >
                  <p className="text-xs text-slate-500 mb-1">
                    {format(parseISO(h.data), 'dd/MM/yyyy')}
                  </p>
                  <p className="font-semibold text-sm text-slate-900">Para: {h.nova_categoria}</p>
                  <p className="text-sm text-slate-700">
                    Lote Destino:{' '}
                    <span className="font-medium">
                      {h.expand?.novo_lote_destino_id?.nome_lote || '-'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600 mt-2 italic">"{h.motivo}"</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
