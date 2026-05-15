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
import { ArrowRightLeft, CheckSquare, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { updateAnimal } from '@/services/animais'

export default function Apartacao() {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<any[]>([])
  const [pastos, setPastos] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])
  const [sourceLoteId, setSourceLoteId] = useState('')
  const [destLoteId, setDestLoteId] = useState('')
  const [destPastoId, setDestPastoId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [motivo, setMotivo] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)

  const loadData = () => {
    pb.collection('lotes').getFullList().then(setLotes)
    pb.collection('pastos_e_piquetes').getFullList().then(setPastos)
    pb.collection('animais')
      .getFullList({ filter: 'status="Ativo"', expand: 'lote_atual_id,piquete_atual_id' })
      .then(setAnimais)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lotes', loadData)
  useRealtime('pastos_e_piquetes', loadData)
  useRealtime('animais', loadData)

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
    if (!sourceLoteId || !destLoteId || !destPastoId || selectedIds.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione animais, lote e pasto de destino.',
        variant: 'destructive',
      })
      return
    }

    setIsTransferring(true)
    try {
      const numTransferidos = selectedIds.length

      await Promise.all(
        selectedIds.map(async (id) => {
          const animal = animais.find((a) => a.id === id)

          // Using updateAnimal calls our custom route which maintains counts correctly!
          await updateAnimal(id, {
            lote_atual_id: destLoteId,
            piquete_atual_id: destPastoId,
          })

          await pb.collection('apartacao_dinamica').create({
            animal_id: id,
            data_apartacao: new Date().toISOString(),
            lote_anterior_id: sourceLoteId,
            lote_novo_id: destLoteId,
            pasto_anterior_id: animal?.piquete_atual_id || null,
            pasto_novo_id: destPastoId,
            motivo,
          })
        }),
      )

      toast({
        title: 'Apartação Concluída!',
        description: `${numTransferidos} animais transferidos com sucesso.`,
        className: 'bg-green-600 text-white',
      })

      setSelectedIds([])
      setMotivo('')
    } catch {
      toast({
        title: 'Erro na apartação',
        description: 'Ocorreu um erro ao processar a transferência.',
        variant: 'destructive',
      })
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-20 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ArrowRightLeft className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Apartação Dinâmica</h2>
          <p className="text-sm text-muted-foreground">
            Mova animais entre lotes e pastos de forma simplificada e automatizada.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lote de Origem <span className="text-red-500">*</span>
                </label>
                <Select
                  value={sourceLoteId}
                  onValueChange={(v) => {
                    setSourceLoteId(v)
                    setSelectedIds([])
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o Lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_lote} ({l.quantidade_cabecas || 0} cabeças)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Destino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Lote de Destino <span className="text-red-500">*</span>
                </label>
                <Select value={destLoteId} onValueChange={setDestLoteId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o Lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_lote} ({l.quantidade_cabecas || 0} cabeças)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Pasto/Piquete de Destino <span className="text-red-500">*</span>
                </label>
                <Select value={destPastoId} onValueChange={setDestPastoId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o Pasto" />
                  </SelectTrigger>
                  <SelectContent>
                    {pastos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} (Ocupação: {p.taxa_lotacao_atual || 0}/{p.capacidade || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sourceLoteId && (
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 border-b">
            <div>
              <CardTitle className="text-lg">Animais no Lote de Origem</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIds.length} de {sourceAnimais.length} animais selecionados
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Input
                placeholder="Motivo da transferência..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full sm:w-[220px]"
              />
              <Button variant="outline" onClick={toggleAll} className="bg-white">
                <CheckSquare className="w-4 h-4 mr-2" />
                {selectedIds.length === sourceAnimais.length && sourceAnimais.length > 0
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={selectedIds.length === 0 || !destLoteId || !destPastoId || isTransferring}
                className="min-w-[140px]"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transferindo
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Transferir
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[50px] text-center">
                    <input
                      type="checkbox"
                      checked={
                        sourceAnimais.length > 0 && selectedIds.length === sourceAnimais.length
                      }
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Brinco (ID Manejo)</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pasto Atual</TableHead>
                  <TableHead className="text-right">Peso Atual (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceAnimais.map((a) => (
                  <TableRow
                    key={a.id}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIds.includes(a.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => toggleAnimal(a.id)}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => {}} // Controlled by row click
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">{a.id_manejo_brinco}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {a.categoria || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{a.expand?.piquete_atual_id?.nome || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {a.peso_atual_kg ? `${a.peso_atual_kg} kg` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {sourceAnimais.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <p className="mb-2">Nenhum animal ativo encontrado neste lote.</p>
                      <p className="text-xs">
                        Certifique-se de que os animais estão com o status "Ativo".
                      </p>
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
