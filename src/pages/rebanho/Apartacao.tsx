import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowRightRight, CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Apartacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [sourceLoteId, setSourceLoteId] = useState('')
  const [destLoteId, setDestLoteId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const sourceAnimais = state.animais.filter(
    (a) => a.loteId === sourceLoteId && a.status === 'Ativo',
  )

  const toggleAll = () => {
    if (selectedIds.length === sourceAnimais.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sourceAnimais.map((a) => a.id))
    }
  }

  const toggleAnimal = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } else {
      setSelectedIds((prev) => [...prev, id])
    }
  }

  const handleTransfer = () => {
    if (!sourceLoteId || !destLoteId) {
      toast({
        title: 'Aviso',
        description: 'Selecione o Lote de Origem e Destino.',
        variant: 'destructive',
      })
      return
    }
    if (sourceLoteId === destLoteId) {
      toast({
        title: 'Aviso',
        description: 'O Lote de Origem e Destino não podem ser o mesmo.',
        variant: 'destructive',
      })
      return
    }
    if (selectedIds.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos um animal para transferir.',
        variant: 'destructive',
      })
      return
    }

    const destLote = state.lotes.find((l) => l.id === destLoteId)
    if (!destLote) return

    dispatch((s) => ({
      ...s,
      animais: s.animais.map((a) =>
        selectedIds.includes(a.id)
          ? { ...a, loteId: destLoteId, costCenter: destLote.costCenter }
          : a,
      ),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Animais',
          recordId: `Múltiplos (${selectedIds.length})`,
          oldValue: `Lote: ${state.lotes.find((l) => l.id === sourceLoteId)?.name}`,
          newValue: `Lote: ${destLote.name} / CC: ${destLote.costCenter}`,
        },
        ...s.auditLogs,
      ],
    }))

    toast({
      title: 'Apartação Concluída!',
      description: `${selectedIds.length} animais transferidos para ${destLote.name}.`,
    })
    setSelectedIds([])
    setSourceLoteId('')
    setDestLoteId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowRightRight className="w-8 h-8 text-emerald-900" />
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">
            Apartação (Transferência em Massa)
          </h2>
          <p className="text-sm text-muted-foreground">
            Mova animais entre lotes e atualize centros de custo automaticamente.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-subtle border-t-4 border-t-amber-500">
          <CardHeader>
            <CardTitle>Origem</CardTitle>
            <CardDescription>Selecione o Lote atual dos animais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={sourceLoteId}
              onValueChange={(v) => {
                setSourceLoteId(v)
                setSelectedIds([])
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lote de Origem" />
              </SelectTrigger>
              <SelectContent>
                {state.lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.costCenter})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-t-4 border-t-emerald-600">
          <CardHeader>
            <CardTitle>Destino</CardTitle>
            <CardDescription>Lote de destino que receberá os animais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={destLoteId} onValueChange={setDestLoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lote de Destino" />
              </SelectTrigger>
              <SelectContent>
                {state.lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.costCenter})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {sourceLoteId && (
        <Card className="shadow-subtle mt-4">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Animais no Lote de Origem</CardTitle>
              <CardDescription>
                {sourceAnimais.length} animais disponíveis. Selecionados: {selectedIds.length}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleAll}>
                <CheckSquare className="w-4 h-4 mr-2" /> Selecionar Todos
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={selectedIds.length === 0 || !destLoteId}
                className="bg-emerald-800"
              >
                Transferir Selecionados
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Brinco</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Centro de Custo (Origem)</TableHead>
                  <TableHead className="text-right">Peso Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceAnimais.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => toggleAnimal(a.id)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleAnimal(a.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-bold">{a.brinco}</TableCell>
                    <TableCell>{a.categoria}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.costCenter}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{a.pesoAtual} kg</TableCell>
                  </TableRow>
                ))}
                {sourceAnimais.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum animal ativo neste lote.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
