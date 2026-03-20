import { useState, useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
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
import { FormulacaoItem } from '@/stores/types'
import { formatCurrency } from '@/components/dashboard/KpiCards'

export default function FabricaRacao() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const [openFormulacao, setOpenFormulacao] = useState(false)
  const [formName, setFormName] = useState('')
  const [ingredients, setIngredients] = useState<FormulacaoItem[]>([])

  const [prodFormulacao, setProdFormulacao] = useState('')
  const [prodQtd, setProdQtd] = useState('')

  const insumosDisponiveis = state.estoque.filter((e) => e.category === 'Nutrição')

  const totalPercent = ingredients.reduce((acc, i) => acc + i.percent, 0)

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { itemId: '', percent: 0 }])
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIng = [...ingredients]
    newIng[index] = { ...newIng[index], [field]: value }
    setIngredients(newIng)
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSaveFormulacao = () => {
    if (!formName || ingredients.length === 0) return
    if (totalPercent !== 100) {
      toast({
        title: 'Aviso',
        description: 'A soma das porcentagens deve ser exatamente 100%.',
        variant: 'destructive',
      })
      return
    }

    dispatch((s) => ({
      ...s,
      formulacoes: [
        ...s.formulacoes,
        { id: Math.random().toString(), name: formName, ingredients },
      ],
    }))

    setOpenFormulacao(false)
    setFormName('')
    setIngredients([])
    toast({ title: 'Formula cadastrada com sucesso!' })
  }

  const getFormulacaoCost = (formId: string) => {
    const f = state.formulacoes.find((x) => x.id === formId)
    if (!f) return 0
    let costPerKg = 0
    f.ingredients.forEach((ing) => {
      const item = state.estoque.find((e) => e.id === ing.itemId)
      if (item) {
        costPerKg += item.unitCost * (ing.percent / 100)
      }
    })
    return costPerKg
  }

  const handleProduce = () => {
    const qty = Number(prodQtd)
    if (!prodFormulacao || !qty || isNaN(qty)) return

    const f = state.formulacoes.find((x) => x.id === prodFormulacao)
    if (!f) return

    // Calculate requirements and check stock
    let canProduce = true
    const requirements = f.ingredients.map((ing) => {
      const reqKg = qty * (ing.percent / 100)
      const item = state.estoque.find((e) => e.id === ing.itemId)
      if (!item || item.quantity < reqKg) canProduce = false
      return { itemId: ing.itemId, reqKg, unitCost: item?.unitCost || 0 }
    })

    if (!canProduce) {
      toast({
        title: 'Estoque Insuficiente',
        description: 'Não há matéria-prima suficiente para esta batida.',
        variant: 'destructive',
      })
      return
    }

    const totalCost = requirements.reduce((acc, req) => acc + req.reqKg * req.unitCost, 0)
    const costPerKg = totalCost / qty

    dispatch((s) => {
      // Deduct raw materials
      let newEstoque = s.estoque.map((item) => {
        const req = requirements.find((r) => r.itemId === item.id)
        if (req) return { ...item, quantity: item.quantity - req.reqKg }
        return item
      })

      // Add finished product
      const finishedId = `ff-${f.id}`
      const existing = newEstoque.find((e) => e.id === finishedId)
      if (existing) {
        newEstoque = newEstoque.map((e) =>
          e.id === finishedId ? { ...e, quantity: e.quantity + qty, unitCost: costPerKg } : e,
        )
      } else {
        newEstoque.push({
          id: finishedId,
          name: f.name,
          category: 'Nutrição',
          quantity: qty,
          unit: 'Kg',
          unitCost: costPerKg,
          minStock: 500,
        })
      }

      return {
        ...s,
        estoque: newEstoque,
        producoesRacao: [
          {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            formulacaoId: f.id,
            quantityKg: qty,
            totalCost,
          },
          ...s.producoesRacao,
        ],
        auditLogs: [
          {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            userName: s.currentUser?.name || 'Sistema',
            action: 'Create',
            table: 'ProducaoRacao',
            recordId: f.name,
            oldValue: '-',
            newValue: `${qty} Kg produzidos`,
          },
          ...s.auditLogs,
        ],
      }
    })

    toast({
      title: 'Produção Concluída',
      description: `${qty} Kg de ${f.name} adicionados ao estoque.`,
    })
    setProdFormulacao('')
    setProdQtd('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Factory className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-primary">Fábrica de Ração</h2>
            <p className="text-sm text-muted-foreground">
              Formulação de dietas e produção de misturas (Batida).
            </p>
          </div>
        </div>

        <Dialog open={openFormulacao} onOpenChange={setOpenFormulacao}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
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
                        {insumosDisponiveis.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} (R$ {e.unitCost.toFixed(2)}/{e.unit})
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

              <Button onClick={handleSaveFormulacao} className="w-full bg-primary mt-2">
                Salvar Formulação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-subtle border-t-4 border-t-emerald-600">
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
                  {state.formulacoes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} (Custo: {formatCurrency(getFormulacaoCost(f.id))}/kg)
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
            <Button className="w-full bg-emerald-800" onClick={handleProduce}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Efetivar Produção
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle>Dietas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulação</TableHead>
                  <TableHead>Custo/Kg (Estimado)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.formulacoes.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-semibold">{f.name}</TableCell>
                    <TableCell className="font-mono text-primary font-bold">
                      {formatCurrency(getFormulacaoCost(f.id))}
                    </TableCell>
                  </TableRow>
                ))}
                {state.formulacoes.length === 0 && (
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
