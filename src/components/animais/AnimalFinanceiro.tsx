import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, InfoIcon } from 'lucide-react'
import { format } from 'date-fns'

export function AnimalFinanceiro({
  rentabilidade,
  saleItem,
}: {
  rentabilidade: any
  saleItem: any
}) {
  return (
    <div className="space-y-6">
      {saleItem && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-900">
              <InfoIcon className="w-4 h-4" /> Histórico de Venda Confirmada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-orange-800">
              <div>
                <p className="font-medium text-orange-900/70">Data da Venda</p>
                <p className="font-bold">
                  {saleItem.expand?.venda_id?.data_venda
                    ? format(new Date(saleItem.expand.venda_id.data_venda), 'dd/MM/yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-orange-900/70">Comprador</p>
                <p className="font-bold truncate">
                  {saleItem.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/A'}
                </p>
              </div>
              <div>
                <p className="font-medium text-orange-900/70">Valor Final Arrecadado</p>
                <p className="font-bold text-orange-900">
                  R${' '}
                  {((saleItem.valor_unitario || 0) - (saleItem.desconto_aplicado || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <DollarSign className="w-4 h-4" /> Resumo Financeiro (Rateio Estimado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rentabilidade ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhum registro financeiro granular encontrado para este animal.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Custo Acumulado Rateado
                </p>
                <p className="text-xl font-bold text-red-600">
                  R$ {rentabilidade.custo_total?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Receita (Estimada/Real)
                </p>
                <p className="text-xl font-bold text-green-600">
                  R$ {rentabilidade.receita_estimada?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Lucro</p>
                <p
                  className={`text-xl font-bold ${rentabilidade.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  R$ {rentabilidade.lucro?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">ROI</p>
                <p
                  className={`text-xl font-bold ${rentabilidade.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {rentabilidade.roi?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
