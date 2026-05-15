import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { updateAnimal } from '@/services/animais'
import { createReclassificacao } from '@/services/reclassificacao'
import { useRealtime } from '@/hooks/use-realtime'

export default function Reclassificacao() {
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [animais, setAnimais] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    category: 'Vaca Descarte TIP',
    loteId: '',
    motivo: '',
  })

  const loadData = () => {
    pb.collection('animais')
      .getFullList({ filter: 'status="Ativo"', expand: 'lote_atual_id' })
      .then(setAnimais)
    pb.collection('lotes').getFullList().then(setLotes)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('animais', loadData)
  useRealtime('lotes', loadData)

  const poAnimals = animais.filter((a) => a.categoria?.includes('PO'))

  const openForm = (animal: any) => {
    setSelectedAnimal(animal)
    setForm({ category: 'Vaca Descarte TIP', loteId: '', motivo: '' })
    setOpen(true)
  }

  const handleReclassificar = async () => {
    if (!selectedAnimal || !form.loteId || !form.motivo) {
      toast({
        title: 'Aviso',
        description: 'Preencha o Lote e o Motivo Obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await updateAnimal(selectedAnimal.id, {
        categoria: form.category,
        lote_atual_id: form.loteId,
      })

      await createReclassificacao({
        data: new Date().toISOString(),
        animal_id: selectedAnimal.id,
        nova_categoria: form.category,
        novo_lote_destino_id: form.loteId,
        motivo: form.motivo,
      })

      setOpen(false)
      toast({
        title: 'Reclassificação Sucesso!',
        description: 'Animal reclassificado e movimentado com sucesso.',
        className: 'bg-green-600 text-white',
      })
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao reclassificar: ' + e.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-20 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reclassificação (Descarte PO)</h2>
          <p className="text-muted-foreground text-sm">
            Obrigue a transferência com motivo justificado para animais PO desclassificados.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Animais PO Elegíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Brinco</TableHead>
                <TableHead>Categoria Atual</TableHead>
                <TableHead>Lote Atual</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poAnimals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold">{a.id_manejo_brinco}</TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {a.categoria}
                    </span>
                  </TableCell>
                  <TableCell>{a.expand?.lote_atual_id?.nome_lote || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => openForm(a)}
                    >
                      Rebaixar p/ TIP <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {poAnimals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum animal PO encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação e Reclassificação Comercial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 p-3 rounded-md mb-4 border">
              <p className="text-sm font-medium">
                Animal Selecionado: {selectedAnimal?.id_manejo_brinco}
              </p>
              <p className="text-xs text-muted-foreground">
                Categoria Atual: {selectedAnimal?.categoria}
              </p>
            </div>
            <div>
              <Label>Nova Categoria *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vaca Descarte TIP">Vaca Descarte TIP</SelectItem>
                  <SelectItem value="Novilha TIP">Novilha TIP</SelectItem>
                  <SelectItem value="Garrote TIP">Garrote TIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote Destino (Engorda Comercial) *</Label>
              <Select value={form.loteId} onValueChange={(v) => setForm({ ...form, loteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Lote..." />
                </SelectTrigger>
                <SelectContent>
                  {lotes.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome_lote} ({l.finalidade_principal || 'Sem finalidade'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo Obrigatório *</Label>
              <Input
                required
                placeholder="Ex: Falha reprodutiva, Defeito fenotípico"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </div>
            <Button
              onClick={handleReclassificar}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 mt-4"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Rebaixamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
