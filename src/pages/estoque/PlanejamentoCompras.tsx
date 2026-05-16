import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getEstoqueInsumos,
  updateEstoqueInsumo,
  type EstoqueInsumo,
} from '@/services/estoque_insumos'
import {
  getPlanejamentosAtivos,
  createPlanejamento,
  updatePlanejamento,
  type PlanejamentoCompra,
} from '@/services/planejamento_compras'
import { createEstoqueMovimentacao } from '@/services/estoque_movimentacoes'
import { createAuditoria } from '@/services/auditoria'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Settings2 } from 'lucide-react'
import { ExportButtons } from '@/components/ExportButtons'
import { exportToPDF } from '@/lib/export'

export default function PlanejamentoCompras() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [insumos, setInsumos] = useState<EstoqueInsumo[]>([])
  const [planos, setPlanos] = useState<PlanejamentoCompra[]>([])

  const load = async () => {
    try {
      const [i, p] = await Promise.all([getEstoqueInsumos(), getPlanejamentosAtivos()])
      setInsumos(i)
      setPlanos(p)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('estoque_insumos', load)
  useRealtime('planejamento_compras', load)

  const [cat, setCat] = useState('Todas')
  const [pDialog, setPDialog] = useState<EstoqueInsumo | null>(null)
  const [pForm, setPForm] = useState({
    estoque_ideal: 0,
    prazo_reposicao_dias: 0,
    estoque_minimo_critico: 0,
  })
  const [rDialog, setRDialog] = useState<PlanejamentoCompra | null>(null)
  const [rForm, setRForm] = useState({ qtd: 0, val: 0, nf: '' })

  const data = useMemo(
    () =>
      insumos
        .map((i) => {
          const p = planos.find((x) => x.insumo_id === i.id)
          const cons = i.consumo_medio_diario || 0
          const sug = Math.max((i.estoque_ideal || 0) - i.quantidade_atual, 0)
          return {
            insumo: i,
            plan: p,
            cob: cons > 0 ? Math.floor(i.quantidade_atual / cons) : null,
            sug,
            est: sug * (i.custo_medio_unitario || 0),
            pri:
              i.quantidade_atual <= (i.estoque_minimo_critico || 0)
                ? 'Crítico'
                : i.quantidade_atual < (i.estoque_ideal || 0)
                  ? 'Atenção'
                  : 'Normal',
            out: (i.estoque_ideal || 0) > 0 && sug > (i.estoque_ideal || 0) * 3,
          }
        })
        .filter((d) => cat === 'Todas' || d.insumo.categoria === cat),
    [insumos, planos, cat],
  )

  const openParams = (i: EstoqueInsumo) => {
    setPForm({
      estoque_ideal: i.estoque_ideal || 0,
      prazo_reposicao_dias: i.prazo_reposicao_dias || 0,
      estoque_minimo_critico: i.estoque_minimo_critico || 0,
    })
    setPDialog(i)
  }

  const saveParams = async (e: any) => {
    e.preventDefault()
    if (!pDialog) return
    await updateEstoqueInsumo(pDialog.id, pForm)
    await createAuditoria({
      usuario_id: user?.id,
      tipo_acao: 'Edição',
      tabela_afetada: 'estoque_insumos',
      registro_id: pDialog.id,
      description: `Ajuste parâmetros de compras`,
    })
    toast({ title: 'Salvo' })
    setPDialog(null)
    load()
  }

  const gerar = async (d: any) => {
    await createPlanejamento({
      insumo_id: d.insumo.id,
      quantidade_sugerida: d.sug,
      prioridade: d.pri,
      status: 'Sugerido',
      valor_estimado: d.est,
      usuario_id: user?.id,
    })
    load()
  }

  const handleStatus = async (id: string, st: string) => {
    if (st === 'Recebido') {
      const p = planos.find((x) => x.id === id)
      if (p) {
        setRForm({
          qtd: p.quantidade_sugerida || 0,
          val: insumos.find((i) => i.id === p.insumo_id)?.custo_medio_unitario || 0,
          nf: '',
        })
        setRDialog(p)
      }
      return
    }
    await updatePlanejamento(id, { status: st })
    load()
  }

  const receive = async (e: any) => {
    e.preventDefault()
    if (!rDialog) return
    await createEstoqueMovimentacao({
      tipo: rForm.nf ? 'ENTRADA_NOTA_FISCAL' : 'ENTRADA_MANUAL',
      produto_id: rDialog.insumo_id,
      quantidade: rForm.qtd,
      valor_unitario: rForm.val,
      data: new Date().toISOString().split('T')[0],
      usuario_id: user?.id as string,
    })
    const i = insumos.find((x) => x.id === rDialog.insumo_id)
    if (i)
      await updateEstoqueInsumo(i.id, {
        quantidade_atual: i.quantidade_atual + rForm.qtd,
        custo_medio_unitario: rForm.val,
      })
    await updatePlanejamento(rDialog.id, { status: 'Recebido' })
    setRDialog(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Planejamento de Compras</h1>
        <ExportButtons
          onExportPDF={() =>
            exportToPDF({
              title: 'Compras Sugeridas',
              data: data.map((d) => ({
                p: d.insumo.produto,
                s: d.sug,
                st: d.plan?.status || 'Pendente',
              })),
              columns: [
                { header: 'Item', dataKey: 'p' },
                { header: 'Sugerido', dataKey: 's' },
                { header: 'Status', dataKey: 'st' },
              ],
              userName: user?.name || '',
            })
          }
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-rose-600">
              {data.filter((d) => d.pri === 'Crítico').length} Críticos
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {data.filter((d) => d.sug > 0 && !d.plan).length} Pendentes
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              R$ {data.reduce((a, d) => a + (d.sug > 0 ? d.est : 0), 0).toFixed(2)} Est.
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="py-3 border-b bg-slate-50">
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {Array.from(new Set(insumos.map((i) => i.categoria).filter(Boolean))).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Insumo</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Cob. (Dias)</TableHead>
              <TableHead>Sugestão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.insumo.id}>
                <TableCell>
                  <div>{d.insumo.produto}</div>
                  <Badge
                    variant={
                      d.pri === 'Crítico'
                        ? 'destructive'
                        : d.pri === 'Atenção'
                          ? 'outline'
                          : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {d.pri}
                  </Badge>
                </TableCell>
                <TableCell>{d.insumo.quantidade_atual}</TableCell>
                <TableCell>{d.cob ?? 'S/ Hist.'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 items-center">
                    {d.out && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {d.sug}
                  </div>
                  <div className="text-xs">R${d.est.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  {d.plan ? (
                    <Select
                      value={d.plan.status}
                      onValueChange={(v) => handleStatus(d.plan!.id, v)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sugerido">Sugerido</SelectItem>
                        <SelectItem value="Em Cotação">Cotação</SelectItem>
                        <SelectItem value="Comprado">Comprado</SelectItem>
                        <SelectItem value="Recebido">Recebido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : d.sug > 0 ? (
                    <Button size="sm" onClick={() => gerar(d)}>
                      Gerar
                    </Button>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openParams(d.insumo)}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={!!pDialog} onOpenChange={(v) => !v && setPDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parâmetros</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveParams} className="space-y-4">
            <div>
              <Label>Min. Crítico</Label>
              <Input
                type="number"
                step="any"
                value={pForm.estoque_minimo_critico}
                onChange={(e) =>
                  setPForm({ ...pForm, estoque_minimo_critico: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Estoque Ideal</Label>
              <Input
                type="number"
                step="any"
                value={pForm.estoque_ideal}
                onChange={(e) => setPForm({ ...pForm, estoque_ideal: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Prazo Reposição (Dias)</Label>
              <Input
                type="number"
                value={pForm.prazo_reposicao_dias}
                onChange={(e) =>
                  setPForm({ ...pForm, prazo_reposicao_dias: Number(e.target.value) })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rDialog} onOpenChange={(v) => !v && setRDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={receive} className="space-y-4">
            <div>
              <Label>Qtd Recebida</Label>
              <Input
                type="number"
                step="any"
                value={rForm.qtd}
                onChange={(e) => setRForm({ ...rForm, qtd: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Custo Unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={rForm.val}
                onChange={(e) => setRForm({ ...rForm, val: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>NF (Opcional)</Label>
              <Input
                value={rForm.nf}
                onChange={(e) => setRForm({ ...rForm, nf: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Confirmar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
