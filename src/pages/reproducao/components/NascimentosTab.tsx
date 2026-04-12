import { useState, useEffect } from 'react'
import { Plus, Trash2, Baby } from 'lucide-react'
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
import {
  getRegistrosNascimento,
  saveRegistroNascimento,
  deleteRegistroNascimento,
  createAnimal,
  getIatfs,
} from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export default function NascimentosTab({ femeas, animais }: { femeas: any[]; animais: any[] }) {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const [form, setForm] = useState({
    vaca_mae_id: '',
    data_nascimento: '',
    sexo: '',
    peso_nascer: '',
    numero_tatuagem: '',
    status_rgn: '',
    rgn_abcz: '',
  })

  const loadData = async () => {
    try {
      setData(await getRegistrosNascimento())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('registro_nascimento', () => loadData())

  const handleSave = async () => {
    try {
      // Registrar no sistema de nascimentos
      await saveRegistroNascimento(null, {
        vaca_mae_id: form.vaca_mae_id,
        data_nascimento: form.data_nascimento ? `${form.data_nascimento}T12:00:00.000Z` : null,
        sexo: form.sexo,
        peso_nascer: form.peso_nascer ? parseFloat(form.peso_nascer) : null,
        numero_tatuagem: form.numero_tatuagem,
        status_rgn: form.status_rgn || 'Provisório',
        rgn_abcz: form.rgn_abcz || null,
      })

      // Tentar inferir o pai baseado no último IATF de sucesso
      const iatfs = await getIatfs()
      const lastIatf = iatfs.find(
        (i) => i.matriz_id === form.vaca_mae_id && i.resultado_dg === 'Prenhe',
      )

      // Integrar e criar o animal no rebanho
      await createAnimal({
        id_manejo_brinco: form.numero_tatuagem,
        nome: `Bezerro(a) ${form.numero_tatuagem}`,
        categoria: 'Bezerro',
        sexo: form.sexo,
        data_nascimento: form.data_nascimento ? `${form.data_nascimento}T12:00:00.000Z` : null,
        peso_atual_kg: form.peso_nascer ? parseFloat(form.peso_nascer) : null,
        mae_id: form.vaca_mae_id,
        pai_id: lastIatf?.touro_utilizado_id || null,
        status: 'Ativo',
      })

      toast({
        title: 'Nascimento registrado',
        description: 'Animal cadastrado no rebanho com sucesso.',
      })
      setOpen(false)
      setForm({
        vaca_mae_id: '',
        data_nascimento: '',
        sexo: '',
        peso_nascer: '',
        numero_tatuagem: '',
        status_rgn: '',
        rgn_abcz: '',
      })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteRegistroNascimento(deleteId)
    setDeleteId(null)
    toast({ title: 'Removido com sucesso' })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Registro de Nascimentos</h2>
        <Button
          onClick={() => setOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold"
        >
          <Baby className="w-4 h-4 mr-2" /> Registrar Parto
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tatuagem/Bezerro</TableHead>
              <TableHead>Matriz (Mãe)</TableHead>
              <TableHead>Data Nascimento</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>RGN Status</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-bold text-primary">{item.numero_tatuagem}</TableCell>
                <TableCell className="font-medium text-slate-700">
                  {item.expand?.vaca_mae_id?.id_manejo_brinco || '-'}
                </TableCell>
                <TableCell>
                  {item.data_nascimento
                    ? format(new Date(item.data_nascimento.replace(' ', 'T')), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{item.sexo}</TableCell>
                <TableCell>{item.peso_nascer ? `${item.peso_nascer} kg` : '-'}</TableCell>
                <TableCell>{item.status_rgn}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Nenhum nascimento registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Registrar Nascimento (Parto)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Matriz Mãe</Label>
              <Select
                value={form.vaca_mae_id}
                onValueChange={(v) => setForm({ ...form, vaca_mae_id: v })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nº Tatuagem/Brinco Novo</Label>
                <Input
                  placeholder="Identificação do Bezerro"
                  value={form.numero_tatuagem}
                  onChange={(e) => setForm({ ...form, numero_tatuagem: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peso ao Nascer (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.peso_nascer}
                  onChange={(e) => setForm({ ...form, peso_nascer: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t mt-4">
              <p className="text-xs text-muted-foreground font-medium">
                Ao salvar, este bezerro será automaticamente inserido no cadastro geral de Animais,
                herdando o histórico reprodutivo da mãe.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar & Integrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600">Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este registro?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
