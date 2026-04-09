import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Factory, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function FabricaRacao() {
  const { toast } = useToast()
  const [openFormulacao, setOpenFormulacao] = useState(false)
  const [formName, setFormName] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])

  const [prodFormulacao, setProdFormulacao] = useState('')
  const [prodQtd, setProdQtd] = useState('')

  const [insumos, setInsumos] = useState<any[]>([])
  const [formulacoes, setFormulacoes] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [iRes, fRes] = await Promise.all([
        pb.collection('estoque_insumos').getFullList(),
        pb.collection('formulacoes_racao').getFullList(),
      ])
      setInsumos(iRes)
      setFormulacoes(fRes)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('estoque_insumos', loadData)
  useRealtime('formulacoes_racao', loadData)

  const totalPercent = ingredients.reduce((acc, i) => acc + (Number(i.percent) || 0), 0)

  const handleAddIngredient = () => setIngredients([...ingredients, { itemId: '', percent: 0 }])
  const updateIngredient = (index: number, field: string, value: any) => {
    const newIng = [...ingredients]
    newIng[index] = { ...newIng[index], [field]: value }
    setIngredients(newIng)
  }
  const removeIngredient = (index: number) =>
    setIngredients(ingredients.filter((_, i) => i !== index))

  const handleSaveFormulacao = async () => {
    if (!formName || ingredients.length === 0) return
    if (totalPercent !== 100) {
      toast({
        title: 'Aviso',
        description: 'A soma das porcentagens deve ser exatamente 100%.',
        variant: 'destructive',
      })
      return
    }

    try {
      const fRecord = await pb.collection('formulacoes_racao').create({
        nome_formulacao: formName,
        custo_kg_produzido: 0, // calculated later
      })

      for (const ing of ingredients) {
        await pb.collection('itens_formulacao').create({
          formulacao_id: fRecord.id,
          insumo_id: ing.itemId,
          quantidade_kg: ing.percent, // stores as percent logically
        })
      }

      setOpenFormulacao(false)
      setFormName('')
      setIngredients([])
      toast({ title: 'Formula cadastrada com sucesso!' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar receita.', variant: 'destructive' })
    }
  }

  const handleProduce = async () => {
    const qty = Number(prodQtd)
    if (!prodFormulacao || !qty || isNaN(qty)) return

    try {
      await pb.collection('producao_diaria_racao').create({
        data: new Date().toISOString(),
        formulacao_id: prodFormulacao,
        quantidade_kg_produzida: qty,
        custo_total: 0, // Will be handled by hook or can be ignored if simplified
      })
      toast({
        title: 'Produção Concluída',
        description: `${qty} Kg registrados e estoque em baixa.`,
      })
      setProdFormulacao('')
      setProdQtd('')
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao processar produção.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Factory className="w-8 h-8 text-[#094016]" />
          <div>
            <h2 className="text-2xl font-bold text-[#094016]">Fábrica de Ração</h2>
            <p className="text-sm text-muted-foreground">
              Formulação de dietas e produção de misturas (Batida).
            </p>
          </div>
        </div>

        <Dialog open={openFormulacao} onOpenChange={setOpenFormulacao}>
          <DialogTrigger asChild>
            <Button className="bg-[#094016] hover:bg-[#094016]/90">
              <Plus className="w-4 h-4 mr-2" /> Nova Formulação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Receita / Formulação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>Nome da Dieta (Ex: Ração Engorda 18%)</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Ingredientes</Label>
                  <Button variant="outline" size="sm" onClick={handleAddIngredient}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <Select
                      value={ing.itemId}
                      onValueChange={(v) => updateIngredient(idx, 'itemId', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Insumo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {insumos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.produto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="%"
                      className="w-24"
                      value={ing.percent}
                      onChange={(e) => updateIngredient(idx, 'percent', Number(e.target.value))}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-500 hover:text-rose-700"
                      onClick={() => removeIngredient(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right text-sm font-bold mt-2 text-slate-600">
                  Total:{' '}
                  <span className={totalPercent === 100 ? 'text-emerald-600' : 'text-rose-600'}>
                    {totalPercent}%
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSaveFormulacao}
                className="w-full bg-[#094016] hover:bg-[#094016]/90 mt-2"
              >
                Salvar Formulação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-emerald-600">
          <CardHeader>
            <CardTitle>Produção Diária (Batida)</CardTitle>
            <CardDescription>
              Registre a mistura para gerar estoque de produto acabado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Dieta / Formulação</Label>
              <Select value={prodFormulacao} onValueChange={setProdFormulacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a receita..." />
                </SelectTrigger>
                <SelectContent>
                  {formulacoes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome_formulacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantidade a Produzir (Kg)</Label>
              <Input
                type="number"
                placeholder="Ex: 2000"
                value={prodQtd}
                onChange={(e) => setProdQtd(e.target.value)}
                className="font-mono text-lg"
              />
            </div>
            <Button className="w-full bg-emerald-800 hover:bg-emerald-900" onClick={handleProduce}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Efetivar Produção
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Dietas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulação</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulacoes.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-semibold">{f.nome_formulacao}</TableCell>
                    <TableCell className="font-mono text-[#094016] text-xs text-muted-foreground">
                      {f.id}
                    </TableCell>
                  </TableRow>
                ))}
                {formulacoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                      Nenhuma dieta cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
