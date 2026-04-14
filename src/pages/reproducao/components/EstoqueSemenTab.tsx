import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus, Edit, Trash2, Snowflake } from 'lucide-react'
import {
  getEstoqueSemenList,
  createEstoqueSemen,
  updateEstoqueSemen,
  deleteEstoqueSemen,
  type EstoqueSemen,
} from '@/services/estoque_semen'
import { getCanecasList, type CanecaSemen } from '@/services/canecas_semen'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function EstoqueSemenTab({ touros }: { touros: any[] }) {
  const [estoque, setEstoque] = useState<EstoqueSemen[]>([])
  const [canecas, setCanecas] = useState<CanecaSemen[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EstoqueSemen | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const defaultFormData = {
    touro_doador: '',
    rgd: '',
    genealogia_pai: '',
    genealogia_mae: '',
    avaliacao_pmgz: '',
    botijao_armazenado: '',
    caneca_id: 'none',
    doses_palhetas_disponiveis: 0,
    touro_id: 'none',
  }
  const [formData, setFormData] = useState(defaultFormData)

  const loadData = async () => {
    try {
      const [est, can] = await Promise.all([getEstoqueSemenList(), getCanecasList()])
      setEstoque(est)
      setCanecas(can)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('estoque_semen', () => loadData())
  useRealtime('canecas_semen', () => loadData())

  const filteredEstoque = useMemo(() => {
    const q = search.toLowerCase()
    return estoque.filter(
      (item) => item.touro_doador?.toLowerCase().includes(q) || item.rgd?.toLowerCase().includes(q),
    )
  }, [estoque, search])

  const handleOpenModal = (item?: EstoqueSemen) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        touro_doador: item.touro_doador || '',
        rgd: item.rgd || '',
        genealogia_pai: item.genealogia_pai || '',
        genealogia_mae: item.genealogia_mae || '',
        avaliacao_pmgz: item.avaliacao_pmgz || '',
        botijao_armazenado: item.botijao_armazenado || '',
        caneca_id: item.caneca_id || 'none',
        doses_palhetas_disponiveis: item.doses_palhetas_disponiveis || 0,
        touro_id: item.touro_id || 'none',
      })
    } else {
      setEditingItem(null)
      setFormData(defaultFormData)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload: Partial<EstoqueSemen> = {
        touro_doador: formData.touro_doador,
        rgd: formData.rgd,
        genealogia_pai: formData.genealogia_pai,
        genealogia_mae: formData.genealogia_mae,
        avaliacao_pmgz: formData.avaliacao_pmgz,
        botijao_armazenado: formData.botijao_armazenado,
        doses_palhetas_disponiveis: formData.doses_palhetas_disponiveis,
      }
      if (formData.caneca_id !== 'none') payload.caneca_id = formData.caneca_id
      else payload.caneca_id = ''

      if (formData.touro_id !== 'none') payload.touro_id = formData.touro_id
      else payload.touro_id = ''

      if (editingItem?.id) {
        await updateEstoqueSemen(editingItem.id, payload)
        toast({ title: 'Sucesso', description: 'Registro atualizado.' })
      } else {
        await createEstoqueSemen(payload)
        toast({ title: 'Sucesso', description: 'Registro criado.' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      toast({ title: 'Erro', description: getErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      try {
        await deleteEstoqueSemen(id)
        toast({ title: 'Sucesso', description: 'Registro removido.' })
        loadData()
      } catch (error) {
        toast({ title: 'Erro', description: getErrorMessage(error), variant: 'destructive' })
      }
    }
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Snowflake className="h-6 w-6 text-blue-500" />
            Estoque de Sêmen
          </CardTitle>
          <CardDescription>
            Gerencie o estoque de doses de sêmen para planejamento de IATF
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por touro ou RGD..."
              className="pl-8 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-primary shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Touro / RGD</th>
                <th className="px-4 py-3 font-medium">Genealogia</th>
                <th className="px-4 py-3 font-medium">Avaliação PMGZ</th>
                <th className="px-4 py-3 font-medium">Localização (Botijão / Caneca)</th>
                <th className="px-4 py-3 font-medium text-right">Saldo (Doses)</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEstoque.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredEstoque.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.touro_doador}</div>
                      {item.rgd && (
                        <div className="text-xs text-muted-foreground">RGD: {item.rgd}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="font-semibold">Pai:</span> {item.genealogia_pai || '-'}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">Mãe:</span> {item.genealogia_mae || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-700">
                      {item.avaliacao_pmgz || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{item.botijao_armazenado || 'Sem Botijão'}</div>
                      <div className="text-xs text-muted-foreground">
                        Caneca: {item.expand?.caneca_id?.numero_caneca || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                        {item.doses_palhetas_disponiveis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                          <Edit className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => item.id && handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Estoque' : 'Novo Estoque de Sêmen'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Touro Doador (Nome)*</Label>
              <Input
                value={formData.touro_doador}
                onChange={(e) => setFormData({ ...formData, touro_doador: e.target.value })}
                placeholder="Ex: Backup"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>RGD</Label>
              <Input
                value={formData.rgd}
                onChange={(e) => setFormData({ ...formData, rgd: e.target.value })}
                placeholder="Ex: ABCZ 1234"
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Genealogia (Pai)</Label>
              <Input
                value={formData.genealogia_pai}
                onChange={(e) => setFormData({ ...formData, genealogia_pai: e.target.value })}
                placeholder="Nome do Pai"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Genealogia (Mãe)</Label>
              <Input
                value={formData.genealogia_mae}
                onChange={(e) => setFormData({ ...formData, genealogia_mae: e.target.value })}
                placeholder="Nome da Mãe"
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Avaliação PMGZ</Label>
              <Input
                value={formData.avaliacao_pmgz}
                onChange={(e) => setFormData({ ...formData, avaliacao_pmgz: e.target.value })}
                placeholder="Ex: Top 0.5%"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Quantidade de Doses*</Label>
              <Input
                type="number"
                min="0"
                value={formData.doses_palhetas_disponiveis}
                onChange={(e) =>
                  setFormData({ ...formData, doses_palhetas_disponiveis: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Botijão Armazenado</Label>
              <Input
                value={formData.botijao_armazenado}
                onChange={(e) => setFormData({ ...formData, botijao_armazenado: e.target.value })}
                placeholder="Ex: Botijão 01"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Caneca</Label>
              <Select
                value={formData.caneca_id}
                onValueChange={(val) => setFormData({ ...formData, caneca_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a caneca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {canecas.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      Caneca {c.numero_caneca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Vincular a um Touro Cadastrado (Opcional)</Label>
              <Select
                value={formData.touro_id}
                onValueChange={(val) => setFormData({ ...formData, touro_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o touro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {touros.map((t) => (
                    <SelectItem key={t.id} value={t.id!}>
                      {t.id_manejo_brinco} - {t.nome || 'Sem Nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.touro_doador}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
