import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  getEstacoes,
  saveEstacao,
  deleteEstacao,
  getRepasses,
  saveRepasse,
  deleteRepasse,
} from '@/services/reproducao'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function EstacaoMontaTab({ touros, lotes }: { touros: any[]; lotes: any[] }) {
  const [estacoes, setEstacoes] = useState<any[]>([])
  const [repasses, setRepasses] = useState<any[]>([])
  const [openEstacao, setOpenEstacao] = useState(false)
  const [openRepasse, setOpenRepasse] = useState(false)
  const { toast } = useToast()

  const [formEstacao, setFormEstacao] = useState({
    nome: '',
    data_inicio: '',
    data_fim: '',
    status: 'Ativa',
  })
  const [formRepasse, setFormRepasse] = useState({
    lote_vinculado_id: '',
    touro_repasse_id: '',
    data_entrada: '',
    data_retirada: '',
  })

  const loadData = async () => {
    try {
      setEstacoes(await getEstacoes())
      setRepasses(await getRepasses())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('estacao_monta', () => loadData())
  useRealtime('repasse_monta_natural', () => loadData())

  const handleSaveEstacao = async () => {
    try {
      await saveEstacao(null, {
        nome: formEstacao.nome,
        data_inicio: formEstacao.data_inicio ? `${formEstacao.data_inicio}T12:00:00.000Z` : null,
        data_fim: formEstacao.data_fim ? `${formEstacao.data_fim}T12:00:00.000Z` : null,
        status: formEstacao.status,
      })
      toast({ title: 'Estação salva com sucesso' })
      setOpenEstacao(false)
      setFormEstacao({ nome: '', data_inicio: '', data_fim: '', status: 'Ativa' })
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleSaveRepasse = async () => {
    try {
      await saveRepasse(null, {
        lote_vinculado_id: formRepasse.lote_vinculado_id,
        touro_repasse_id: formRepasse.touro_repasse_id,
        data_entrada: formRepasse.data_entrada ? `${formRepasse.data_entrada}T12:00:00.000Z` : null,
        data_retirada: formRepasse.data_retirada
          ? `${formRepasse.data_retirada}T12:00:00.000Z`
          : null,
      })
      toast({ title: 'Repasse salvo com sucesso' })
      setOpenRepasse(false)
      setFormRepasse({
        lote_vinculado_id: '',
        touro_repasse_id: '',
        data_entrada: '',
        data_retirada: '',
      })
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const handleDeleteEstacao = async (id: string) => {
    if (!confirm('Deseja excluir?')) return
    await deleteEstacao(id)
    toast({ title: 'Excluído com sucesso' })
  }

  const handleDeleteRepasse = async (id: string) => {
    if (!confirm('Deseja excluir?')) return
    await deleteRepasse(id)
    toast({ title: 'Excluído com sucesso' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Estações de Monta</h2>
          <Button
            onClick={() => setOpenEstacao(true)}
            className="bg-primary hover:bg-primary/90 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Estação
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estacoes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.nome}</TableCell>
                  <TableCell>
                    {item.data_inicio
                      ? format(new Date(item.data_inicio.replace(' ', 'T')), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {item.data_fim
                      ? format(new Date(item.data_fim.replace(' ', 'T')), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{item.status || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEstacao(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {estacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma estação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Repasse - Monta Natural</h2>
          <Button
            onClick={() => setOpenRepasse(true)}
            className="bg-primary hover:bg-primary/90 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Repasse
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Touro Utilizado</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Data Retirada</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repasses.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-primary">
                    {item.expand?.lote_vinculado_id?.nome_lote || '-'}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {item.expand?.touro_repasse_id?.id_manejo_brinco || '-'}
                  </TableCell>
                  <TableCell>
                    {item.data_entrada
                      ? format(new Date(item.data_entrada.replace(' ', 'T')), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {item.data_retirada
                      ? format(new Date(item.data_retirada.replace(' ', 'T')), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRepasse(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {repasses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum repasse encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={openEstacao} onOpenChange={setOpenEstacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Nova Estação de Monta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Estação</Label>
              <Input
                value={formEstacao.nome}
                onChange={(e) => setFormEstacao({ ...formEstacao, nome: e.target.value })}
                placeholder="Ex: Estação Águas 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formEstacao.data_inicio}
                  onChange={(e) => setFormEstacao({ ...formEstacao, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formEstacao.data_fim}
                  onChange={(e) => setFormEstacao({ ...formEstacao, data_fim: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formEstacao.status}
                onValueChange={(v) => setFormEstacao({ ...formEstacao, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveEstacao}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRepasse} onOpenChange={setOpenRepasse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Novo Repasse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lote de Fêmeas</Label>
              <Select
                value={formRepasse.lote_vinculado_id}
                onValueChange={(v) => setFormRepasse({ ...formRepasse, lote_vinculado_id: v })}
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
            </div>
            <div className="space-y-2">
              <Label>Touro de Repasse</Label>
              <Select
                value={formRepasse.touro_repasse_id}
                onValueChange={(v) => setFormRepasse({ ...formRepasse, touro_repasse_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Touro" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Entrada</Label>
                <Input
                  type="date"
                  value={formRepasse.data_entrada}
                  onChange={(e) => setFormRepasse({ ...formRepasse, data_entrada: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Retirada</Label>
                <Input
                  type="date"
                  value={formRepasse.data_retirada}
                  onChange={(e) =>
                    setFormRepasse({ ...formRepasse, data_retirada: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveRepasse}
              className="bg-primary hover:bg-primary/90 text-white font-bold w-full"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
