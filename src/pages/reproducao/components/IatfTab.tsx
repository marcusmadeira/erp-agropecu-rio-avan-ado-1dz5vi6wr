import { useState, useEffect } from 'react'
import { Plus, Stethoscope, FilePlus2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getIatfs, saveIatf, saveReclassificacao, updateAnimal } from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function IatfTab({ femeas, touros }: { femeas: any[]; touros: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [openDg, setOpenDg] = useState(false)
  const [currentIatf, setCurrentIatf] = useState<any>(null)
  const { toast } = useToast()

  const [form, setForm] = useState({ matriz_id: '', data_iatf: '', touro_utilizado_id: '' })
  const [formDg, setFormDg] = useState({
    resultado_dg: '',
    data_provavel_parto_dpp: '',
    destinacao: 'Manter PO',
    motivo: '',
  })

  const loadData = async () => {
    try {
      setData(await getIatfs())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('manejo_iatf_curral', () => loadData())

  const handleSaveIatf = async () => {
    try {
      await saveIatf(null, {
        matriz_id: form.matriz_id,
        data_iatf: form.data_iatf ? `${form.data_iatf}T12:00:00.000Z` : null,
        touro_utilizado_id: form.touro_utilizado_id || null,
      })
      toast({ title: 'IATF registrada com sucesso' })
      setOpen(false)
      setForm({ matriz_id: '', data_iatf: '', touro_utilizado_id: '' })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleSaveDg = async () => {
    if (!currentIatf) return
    if (
      (formDg.destinacao === 'Transferir TIP' || formDg.destinacao === 'Descarte') &&
      !formDg.motivo
    ) {
      toast({ title: 'Motivo é obrigatório', variant: 'destructive' })
      return
    }

    try {
      await saveIatf(currentIatf.id, {
        resultado_dg: formDg.resultado_dg,
        data_provavel_parto_dpp:
          formDg.resultado_dg === 'Prenhe' && formDg.data_provavel_parto_dpp
            ? `${formDg.data_provavel_parto_dpp}T12:00:00.000Z`
            : null,
      })

      if (formDg.destinacao === 'Transferir TIP' || formDg.destinacao === 'Descarte') {
        await saveReclassificacao({
          animal_id: currentIatf.matriz_id,
          data: new Date().toISOString(),
          nova_categoria:
            formDg.destinacao === 'Transferir TIP' ? 'Matriz TIP' : 'Vaca Descarte TIP',
          motivo: formDg.motivo,
        })
        await updateAnimal(currentIatf.matriz_id, {
          categoria: formDg.destinacao === 'Transferir TIP' ? 'Matriz TIP' : 'Vaca Descarte TIP',
          status: formDg.destinacao === 'Descarte' ? 'Para Descarte' : 'Ativo',
        })
      }

      toast({ title: 'Diagnóstico registrado com sucesso' })
      setOpenDg(false)
      setFormDg({
        resultado_dg: '',
        data_provavel_parto_dpp: '',
        destinacao: 'Manter PO',
        motivo: '',
      })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleNovaIatf = (matriz_id: string) => {
    setForm({
      matriz_id,
      data_iatf: new Date().toISOString().split('T')[0],
      touro_utilizado_id: '',
    })
    setOpen(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Protocolos IATF</h2>
        <Button
          onClick={() => handleNovaIatf('')}
          className="bg-primary hover:bg-primary/90 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Inseminação
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matriz</TableHead>
              <TableHead>Data IATF</TableHead>
              <TableHead>Touro Utilizado</TableHead>
              <TableHead>Resultado DG</TableHead>
              <TableHead>DPP</TableHead>
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-primary">
                  {item.expand?.matriz_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>
                  {item.data_iatf
                    ? format(new Date(item.data_iatf.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{item.expand?.touro_utilizado_id?.id_manejo_brinco || '-'}</TableCell>
                <TableCell>
                  {item.resultado_dg === 'Prenhe' ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                      Prenhe
                    </span>
                  ) : item.resultado_dg === 'Vazia' ? (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-bold">
                      Vazia
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                      Pendente
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-slate-700">
                  {item.data_provavel_parto_dpp
                    ? format(new Date(item.data_provavel_parto_dpp.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!item.resultado_dg && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-primary text-primary"
                        onClick={() => {
                          setCurrentIatf(item)
                          setOpenDg(true)
                        }}
                      >
                        <Stethoscope className="w-3 h-3 mr-1" /> DG / Destino
                      </Button>
                    )}
                    {item.resultado_dg === 'Vazia' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-amber-600 hover:text-amber-700"
                        onClick={() => handleNovaIatf(item.matriz_id)}
                      >
                        <FilePlus2 className="w-3 h-3 mr-1" /> 2ª IATF
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum registro de IATF encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Registrar IATF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Matriz</Label>
              <Select
                value={form.matriz_id}
                onValueChange={(v) => setForm({ ...form, matriz_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matriz" />
                </SelectTrigger>
                <SelectContent>
                  {femeas.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.id_manejo_brinco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data IATF</Label>
              <Input
                type="date"
                value={form.data_iatf}
                onChange={(e) => setForm({ ...form, data_iatf: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Touro Utilizado</Label>
              <Select
                value={form.touro_utilizado_id}
                onValueChange={(v) => setForm({ ...form, touro_utilizado_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o touro" />
                </SelectTrigger>
                <SelectContent>
                  {touros.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id_manejo_brinco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveIatf}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar Inseminação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDg} onOpenChange={setOpenDg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Diagnóstico Gestacional & Destinação</DialogTitle>
            <DialogDescription>
              Matriz: {currentIatf?.expand?.matriz_id?.id_manejo_brinco}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Resultado DG</Label>
              <Select
                value={formDg.resultado_dg}
                onValueChange={(v) => setFormDg({ ...formDg, resultado_dg: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prenhe">Prenhe</SelectItem>
                  <SelectItem value="Vazia">Vazia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formDg.resultado_dg === 'Prenhe' && (
              <div className="space-y-2">
                <Label>Data Provável de Parto (DPP)</Label>
                <Input
                  type="date"
                  value={formDg.data_provavel_parto_dpp}
                  onChange={(e) =>
                    setFormDg({ ...formDg, data_provavel_parto_dpp: e.target.value })
                  }
                />
              </div>
            )}
            <div className="space-y-2 mt-4 pt-4 border-t">
              <Label>Destinação da Matriz</Label>
              <Select
                value={formDg.destinacao}
                onValueChange={(v) => setFormDg({ ...formDg, destinacao: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manter PO">Manter no Rebanho PO</SelectItem>
                  <SelectItem value="Transferir TIP">
                    Transferir para Rebanho Comercial (TIP)
                  </SelectItem>
                  <SelectItem value="Descarte">Destinar para Descarte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formDg.destinacao === 'Transferir TIP' || formDg.destinacao === 'Descarte') && (
              <div className="space-y-2 animate-fade-in-up">
                <Label>
                  Motivo / Observação <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Ex: Matriz falhou em 2 IATFs"
                  value={formDg.motivo}
                  onChange={(e) => setFormDg({ ...formDg, motivo: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveDg}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar DG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
