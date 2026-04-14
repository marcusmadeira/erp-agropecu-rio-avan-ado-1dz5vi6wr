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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowRightLeft, CheckSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'

export default function Apartacao() {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [sourceLoteId, setSourceLoteId] = useState('')
  const [destLoteId, setDestLoteId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    pb.collection('lotes').getFullList().then(setLotes)
    pb.collection('animais')
      .getFullList({ filter: 'status="Ativo"', expand: 'lote_atual_id' })
      .then(setAnimais)
  }, [])

  const sourceAnimais = animais.filter((a) => a.lote_atual_id === sourceLoteId)

  const toggleAll = () => {
    if (selectedIds.length === sourceAnimais.length) setSelectedIds([])
    else setSelectedIds(sourceAnimais.map((a) => a.id))
  }

  const toggleAnimal = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds((prev) => prev.filter((x) => x !== id))
    else setSelectedIds((prev) => [...prev, id])
  }

  const handleTransfer = async () => {
    if (!sourceLoteId || !destLoteId || selectedIds.length === 0) return
    try {
      await Promise.all(
        selectedIds.map((id) => pb.collection('animais').update(id, { lote_atual_id: destLoteId })),
      )
      await Promise.all(
        selectedIds.map((id) =>
          pb.collection('apartacao_dinamica').create({
            animal_id: id,
            data_apartacao: new Date().toISOString(),
            lote_anterior_id: sourceLoteId,
            lote_novo_id: destLoteId,
            motivo,
          }),
        ),
      )
      toast({ title: 'Apartação Concluída!' })
      const updated = await pb
        .collection('animais')
        .getFullList({ filter: 'status="Ativo"', expand: 'lote_atual_id' })
      setAnimais(updated)
      setSelectedIds([])
      setMotivo('')
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="w-8 h-8 text-[#094016]" />
        <div>
          <h2 className="text-2xl font-bold text-[#094016]">Apartação Dinâmica</h2>
          <p className="text-sm text-muted-foreground">
            Mova animais entre lotes de forma simplificada.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-amber-500">
          <CardHeader>
            <CardTitle>Lote de Origem</CardTitle>
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
                <SelectValue placeholder="Selecione o Lote" />
              </SelectTrigger>
              <SelectContent>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-[#094016]">
          <CardHeader>
            <CardTitle>Lote de Destino</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={destLoteId} onValueChange={setDestLoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lote" />
              </SelectTrigger>
              <SelectContent>
                {lotes.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {sourceLoteId && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Animais no Lote de Origem</CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Input
                placeholder="Motivo (opcional)..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full sm:w-[200px]"
              />
              <Button variant="outline" onClick={toggleAll}>
                <CheckSquare className="w-4 h-4 mr-2" /> Selecionar Todos
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={selectedIds.length === 0 || !destLoteId}
                className="bg-[#094016] text-white hover:bg-[#094016]/90"
              >
                Transferir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Brinco</TableHead>
                  <TableHead>Categoria</TableHead>
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
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-bold">{a.id_manejo_brinco}</TableCell>
                    <TableCell>{a.categoria}</TableCell>
                    <TableCell className="text-right">{a.peso_atual_kg} kg</TableCell>
                  </TableRow>
                ))}
                {sourceAnimais.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Lote vazio.
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
