import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { useInttegraSync } from '@/hooks/useInttegraSync'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'

export default function Nascimentos() {
  const { state, dispatch } = useAppStore()
  const { pushRecord } = useInttegraSync()
  const { toast } = useToast()

  const [openNasc, setOpenNasc] = useState(false)
  const [selectedRepro, setSelectedRepro] = useState<any>(null)
  const [formNasc, setFormNasc] = useState({ peso: '', sexo: 'M' })

  const [openDesmama, setOpenDesmama] = useState(false)
  const [selectedBezerro, setSelectedBezerro] = useState<any>(null)
  const [formDesmama, setFormDesmama] = useState({ brinco: '', rgn: '', loteId: '' })

  const prenhes = state.reproducoes.filter((r) => r.status === 'Prenhe')
  const bezerrosLactentes = state.animais.filter(
    (a) => a.categoria === 'Bezerro' && a.status === 'Lactente',
  )

  const handleRegistrarNascimento = () => {
    if (!selectedRepro) return
    const matriz = state.animais.find((a) => a.id === selectedRepro.animalId)
    if (!matriz) return

    const bezerroId = Math.random().toString()
    const now = new Date().toISOString()
    const novoBezerro = {
      id: bezerroId,
      brinco: `PEND-${Math.floor(Math.random() * 1000)}`,
      loteId: matriz.loteId,
      categoria: 'Bezerro',
      pesoAtual: Number(formNasc.peso),
      pesoEntrada: Number(formNasc.peso),
      gmd: 0,
      mae: matriz.id,
      pai: selectedRepro.touro,
      status: 'Lactente',
      birthDate: now,
      costCenter: matriz.costCenter,
      gender: formNasc.sexo as any,
      custoAcumulado: 0,
    }

    dispatch((s) => {
      const repros = s.reproducoes.map((r) =>
        r.id === selectedRepro.id ? { ...r, status: 'Parida' as any } : r,
      )

      return {
        ...s,
        reproducoes: repros,
        animais: [...s.animais, novoBezerro],
      }
    })

    pushRecord('Nascimentos_e_Desmama', bezerroId, novoBezerro)
    setOpenNasc(false)
    toast({ title: 'Nascimento Registrado', description: 'Bezerro aguardando desmama.' })
    setFormNasc({ peso: '', sexo: 'M' })
  }

  const handleDesmamar = () => {
    if (!selectedBezerro || !formDesmama.brinco || !formDesmama.loteId) return

    const selectedLote = state.lotes.find((l) => l.id === formDesmama.loteId)

    dispatch((s) => ({
      ...s,
      animais: s.animais.map((a) =>
        a.id === selectedBezerro.id
          ? {
              ...a,
              brinco: formDesmama.brinco,
              rgn: formDesmama.rgn,
              loteId: formDesmama.loteId,
              costCenter: selectedLote?.costCenter || a.costCenter,
              categoria: selectedBezerro.gender === 'M' ? 'Garrote' : 'Novilha',
              status: 'Ativo',
            }
          : a,
      ),
      auditLogs: [
        {
          id: Math.random().toString(),
          date: new Date().toISOString(),
          userName: s.currentUser?.name || 'Sistema',
          action: 'Update',
          table: 'Animais',
          recordId: formDesmama.brinco,
          oldValue: 'Lactente',
          newValue: 'Desmamado / Ativo',
        },
        ...s.auditLogs,
      ],
    }))

    setOpenDesmama(false)
    toast({
      title: 'Desmama Realizada',
      description: 'Animal efetivado no rebanho principal com genealogia.',
    })
    setFormDesmama({ brinco: '', rgn: '', loteId: '' })
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <h2 className="text-2xl font-bold text-primary">Maternidade e Desmama</h2>

      <Tabs defaultValue="partos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="partos">Próximos Partos</TabsTrigger>
          <TabsTrigger value="desmama">Bezerros Lactentes</TabsTrigger>
        </TabsList>

        <TabsContent value="partos" className="mt-4">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Matrizes Próximas ao Parto</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brinco Matriz</TableHead>
                    <TableHead>DPP</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prenhes.map((r) => {
                    const a = state.animais.find((x) => x.id === r.animalId)
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold text-lg">{a?.brinco}</TableCell>
                        <TableCell className="text-slate-600">
                          {format(parseISO(r.dpp), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRepro(r)
                              setOpenNasc(true)
                            }}
                            className="bg-primary"
                          >
                            Registrar Parto
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {prenhes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6">
                        Nenhuma matriz prenhe registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desmama" className="mt-4">
          <Card className="shadow-subtle border-t-4 border-t-indigo-500">
            <CardHeader>
              <CardTitle>Lote de Lactentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Provisório</TableHead>
                    <TableHead>Data Nascimento</TableHead>
                    <TableHead>Matriz Mãe</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bezerrosLactentes.map((b) => {
                    const mae = state.animais.find((x) => x.id === b.mae)
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-slate-500">{b.brinco}</TableCell>
                        <TableCell>{format(parseISO(b.birthDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-bold">{mae?.brinco}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => {
                              setSelectedBezerro(b)
                              setOpenDesmama(true)
                            }}
                          >
                            Realizar Desmama
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {bezerrosLactentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhum bezerro aguardando desmama.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nascimento */}
      <Dialog open={openNasc} onOpenChange={setOpenNasc}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Registrar Nascimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <label className="text-base font-semibold text-slate-800">Peso ao Nascer (Kg)</label>
              <Input
                type="number"
                placeholder="Ex: 35"
                className="h-16 text-2xl text-center rounded-xl font-mono bg-slate-50 border-slate-200"
                value={formNasc.peso}
                onChange={(e) => setFormNasc({ ...formNasc, peso: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-base font-semibold text-slate-800">Sexo do Bezerro</label>
              <Select
                value={formNasc.sexo}
                onValueChange={(v) => setFormNasc({ ...formNasc, sexo: v })}
              >
                <SelectTrigger className="h-16 text-xl rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M" className="text-lg py-3">
                    Macho
                  </SelectItem>
                  <SelectItem value="F" className="text-lg py-3">
                    Fêmea
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRegistrarNascimento}
              className="w-full h-16 text-xl font-bold bg-primary rounded-xl mt-4 active:scale-[0.98] transition-transform"
            >
              Salvar Bezerro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Desmama */}
      <Dialog open={openDesmama} onOpenChange={setOpenDesmama}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Efetivar Desmama</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Insira o brinco definitivo e defina o lote para efetivar o animal no rebanho. A
              genealogia (Matriz Mãe) será associada automaticamente.
            </p>
            <div>
              <Label>Brinco Definitivo (ID Manejo)</Label>
              <Input
                value={formDesmama.brinco}
                onChange={(e) => setFormDesmama({ ...formDesmama, brinco: e.target.value })}
              />
            </div>
            <div>
              <Label>RGN ABCZ (Opcional)</Label>
              <Input
                value={formDesmama.rgn}
                onChange={(e) => setFormDesmama({ ...formDesmama, rgn: e.target.value })}
              />
            </div>
            <div>
              <Label>Lote Destino</Label>
              <Select
                value={formDesmama.loteId}
                onValueChange={(v) => setFormDesmama({ ...formDesmama, loteId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Lote..." />
                </SelectTrigger>
                <SelectContent>
                  {state.lotes.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDesmamar}
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
            >
              Concluir Desmama
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
