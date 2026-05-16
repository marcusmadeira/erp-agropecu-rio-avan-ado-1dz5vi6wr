import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { exportSimulacaoPDF } from '@/lib/pdf'
import { useAuth } from '@/hooks/use-auth'
import { createAuditoria } from '@/services/auditoria'
import { useEffect } from 'react'

export function RelatorioSimuladorDialog({
  sim,
  open,
  onOpenChange,
}: {
  sim: any
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { user } = useAuth()

  useEffect(() => {
    if (open && sim) {
      createAuditoria({
        usuario_id: user?.id,
        tipo_acao: 'READ',
        tabela_afetada: 'simulacoes_cenarios',
        registro_id: sim.id,
        description: `Geração de Relatório TIP - Cenário ${sim.id}`,
      }).catch(console.error)
    }
  }, [open, sim, user?.id])

  if (!sim) return null

  const handleExport = async () => {
    try {
      await createAuditoria({
        usuario_id: user?.id,
        tipo_acao: 'EXPORT',
        tabela_afetada: 'simulacoes_cenarios',
        registro_id: sim.id,
        description: `Exportação/Impressão de Relatório TIP - Cenário ${sim.id}`,
      })
    } catch (e) {
      console.error('Falha ao registrar auditoria', e)
    }
    await exportSimulacaoPDF(sim, user?.name || user?.email || 'Desconhecido')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#094016]">
            Relatório Gerencial de Simulação
          </DialogTitle>
          <DialogDescription>
            Análise de viabilidade econômica e zootécnica de {sim.tipo_operacao || 'TIP'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <p className="text-sm text-slate-500">Data da Simulação</p>
              <p className="font-medium">
                {new Date(sim.created || new Date()).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Autor</p>
              <p className="font-medium">{user?.name || user?.email || 'Desconhecido'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">ID Cenário</p>
              <p className="font-medium text-right text-xs bg-slate-100 px-2 py-1 rounded mt-1">
                {sim.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">
                Identificação & Premissas do Lote
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo de Operação:</span>{' '}
                  <span className="font-medium">{sim.tipo_operacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantidade de Animais:</span>{' '}
                  <span className="font-medium">{sim.quantidade_animais}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peso de Entrada:</span>{' '}
                  <span className="font-medium">
                    {sim.peso_entrada ? sim.peso_entrada + ' kg' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preço de Compra (@):</span>{' '}
                  <span className="font-medium">
                    {sim.preco_compra ? 'R$ ' + sim.preco_compra.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duração Estimada:</span>{' '}
                  <span className="font-medium">
                    {sim.dias_duracao ? sim.dias_duracao + ' dias' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">
                Indicadores Zootécnicos
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">GMD Estimado:</span>{' '}
                  <span className="font-medium">
                    {sim.gmd_estimado ? sim.gmd_estimado.toFixed(3) + ' kg/dia' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peso Final Projetado:</span>{' '}
                  <span className="font-medium">
                    {sim.peso_final ? sim.peso_final.toFixed(1) + ' kg' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Arrobas Produzidas:</span>{' '}
                  <span className="font-medium">
                    {sim.arrobas_produzidas ? sim.arrobas_produzidas.toFixed(2) + ' @' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">
                Custos Detalhados (Estimativa Diária/Animal)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Custo Ração/dia:</span>{' '}
                  <span className="font-medium">
                    {sim.custo_acao ? 'R$ ' + sim.custo_acao.toFixed(2) : 'Não Informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Custo Mão de Obra/dia:</span>{' '}
                  <span className="font-medium">
                    {sim.custo_mao_obra ? 'R$ ' + sim.custo_mao_obra.toFixed(2) : 'Não Informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Custos Adicionais/dia:</span>{' '}
                  <span className="font-medium">
                    {sim.custo_adicionais
                      ? 'R$ ' + sim.custo_adicionais.toFixed(2)
                      : 'Não Informado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">
                Indicadores Econômico-Financeiros
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Custo Total Operacional:</span>{' '}
                  <span className="font-medium">
                    {sim.custo_total
                      ? 'R$ ' +
                        sim.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Custo por @ Produzida:</span>{' '}
                  <span className="font-medium">
                    {sim.custo_arroba ? 'R$ ' + sim.custo_arroba.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preço de Venda (@):</span>{' '}
                  <span className="font-medium">
                    {sim.preco_venda ? 'R$ ' + sim.preco_venda.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#094016]/5 p-6 rounded-lg border border-[#094016]/20">
            <h3 className="font-bold text-[#094016] mb-4">Resultado Final Projetado</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Receita Total</p>
                <p className="text-xl font-bold text-slate-900">
                  {sim.receita_total
                    ? 'R$ ' +
                      sim.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Lucro Bruto</p>
                <p
                  className={`text-xl font-bold ${sim.lucro_bruto >= 0 ? 'text-[#094016]' : 'text-red-600'}`}
                >
                  {sim.lucro_bruto
                    ? 'R$ ' + sim.lucro_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Margem de Lucro</p>
                <p
                  className={`text-xl font-bold ${sim.margem_lucro >= 0 ? 'text-[#094016]' : 'text-red-600'}`}
                >
                  {sim.margem_lucro ? sim.margem_lucro.toFixed(2) + '%' : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">ROI</p>
                <p
                  className={`text-xl font-bold ${sim.roi >= 0 ? 'text-[#094016]' : 'text-red-600'}`}
                >
                  {sim.roi ? sim.roi.toFixed(2) + '%' : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleExport} className="bg-[#094016] hover:bg-[#094016]/90">
            <Printer className="w-4 h-4 mr-2" /> Exportar / Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
