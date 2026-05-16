import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSimulacoes, deleteSimulacao } from '@/services/simulacoes'
import { Trash2, Scale, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RelatorioSimuladorDialog } from './RelatorioSimuladorDialog'

export function HistoricoTab() {
  const [sims, setSims] = useState<any[]>([])
  const { toast } = useToast()
  const [compareData, setCompareData] = useState<any>(null)
  const [selectedSimForReport, setSelectedSimForReport] = useState<any>(null)

  const load = () => getSimulacoes().then(setSims)
  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta simulação?')) return
    try {
      await deleteSimulacao(id)
      toast({ title: 'Excluído com sucesso' })
      load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleCompareRealized = (sim: any) => {
    const actualProfit = sim.lucro_bruto * (0.85 + Math.random() * 0.3)
    const accuracy = 100 - Math.abs(((actualProfit - sim.lucro_bruto) / sim.lucro_bruto) * 100)
    setCompareData({ sim, actualProfit, accuracy })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Simulações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Operação</th>
                  <th className="px-4 py-3">Animais</th>
                  <th className="px-4 py-3">Lucro Estimado</th>
                  <th className="px-4 py-3">Margem</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sims.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">{new Date(s.created).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{s.tipo_operacao}</Badge>
                    </td>
                    <td className="px-4 py-3">{s.quantidade_animais}</td>
                    <td className="px-4 py-3 text-[#094016] font-medium">
                      R$ {s.lucro_bruto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">{s.margem_lucro?.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSimForReport(s)}
                      >
                        <FileText className="w-4 h-4 mr-1" /> Relatório
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCompareRealized(s)}>
                        <Scale className="w-4 h-4 mr-1" /> Comparar Real
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {sims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma simulação salva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {compareData && (
        <Dialog open={!!compareData} onOpenChange={(o) => !o && setCompareData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Análise de Acurácia: Previsto vs Realizado</DialogTitle>
              <DialogDescription>Comparação com dados financeiros realizados.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span className="text-muted-foreground">Lucro Estimado</span>
                <span className="font-bold">
                  R${' '}
                  {compareData.sim.lucro_bruto?.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-md">
                <span className="text-muted-foreground">Lucro Realizado (Mock)</span>
                <span className="font-bold">
                  R${' '}
                  {compareData.actualProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-md bg-muted">
                <span className="font-medium">Acurácia da Simulação</span>
                <Badge className={compareData.accuracy >= 90 ? 'bg-green-600' : 'bg-amber-500'}>
                  {compareData.accuracy?.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <RelatorioSimuladorDialog
        sim={selectedSimForReport}
        open={!!selectedSimForReport}
        onOpenChange={(o) => !o && setSelectedSimForReport(null)}
      />
    </>
  )
}
