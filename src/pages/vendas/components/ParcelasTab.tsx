import { useState, useEffect, useCallback } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getParcelas, getBoletosDaVenda } from '@/services/financeiro_vendas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Link as LinkIcon, FileText } from 'lucide-react'
import ParcelaDialog from './ParcelaDialog'
import BoletoDialog from './BoletoDialog'

export default function ParcelasTab({ vendaId }: { vendaId: string }) {
  const [parcelas, setParcelas] = useState<any[]>([])
  const [boletos, setBoletos] = useState<any[]>([])
  const [parcelaEdit, setParcelaEdit] = useState<any>(null)
  const [boletoEdit, setBoletoEdit] = useState<any>(null)
  const [parcelaForBoleto, setParcelaForBoleto] = useState<string | null>(null)
  const [isParcelaOpen, setIsParcelaOpen] = useState(false)
  const [isBoletoOpen, setIsBoletoOpen] = useState(false)

  const loadData = useCallback(async () => {
    const [p, b] = await Promise.all([getParcelas(vendaId), getBoletosDaVenda(vendaId)])
    setParcelas(p)
    setBoletos(b)
  }, [vendaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('parcelas_venda', loadData)
  useRealtime('boletos', loadData)

  const getStatusColor = (s: string) => {
    if (s === 'Paga' || s === 'Pago') return 'bg-emerald-500'
    if (s === 'Atrasada' || s === 'Vencido') return 'bg-red-500'
    if (s === 'Cancelada' || s === 'Cancelado') return 'bg-gray-500'
    return 'bg-amber-500'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Gerenciamento de Parcelas e Boletos</h3>
        <Button
          onClick={() => {
            setParcelaEdit(null)
            setIsParcelaOpen(true)
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Parcela
        </Button>
      </div>

      <div className="grid gap-4">
        {parcelas.map((p) => {
          const pBoletos = boletos.filter((b) => b.parcela_id === p.id)
          return (
            <Card
              key={p.id}
              className="p-5 border-l-4"
              style={{
                borderLeftColor:
                  p.status_parcela === 'Paga'
                    ? '#10b981'
                    : p.status_parcela === 'Atrasada'
                      ? '#ef4444'
                      : '#f59e0b',
              }}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">Parcela {p.numero_parcela}</span>
                    <Badge className={`${getStatusColor(p.status_parcela)} text-white`}>
                      {p.status_parcela}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Total: R$ {p.valor_total_com_juros?.toFixed(2) || p.valor_parcela.toFixed(2)}
                    <span className="mx-2">|</span>
                    Vence em: {new Date(p.data_vencimento).toLocaleDateString()}
                    {p.dias_atraso > 0 && (
                      <span className="text-red-500 ml-2 font-semibold">
                        ({p.dias_atraso} dias de atraso)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParcelaForBoleto(p.id)
                      setBoletoEdit(null)
                      setIsBoletoOpen(true)
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" /> Add Boleto
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setParcelaEdit(p)
                      setIsParcelaOpen(true)
                    }}
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {pBoletos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-md p-3">
                  <h4 className="text-sm font-semibold mb-3 flex items-center text-gray-700">
                    <FileText className="w-4 h-4 mr-2" /> Boletos Vinculados
                  </h4>
                  <div className="space-y-2">
                    {pBoletos.map((b) => (
                      <div
                        key={b.id}
                        className="flex justify-between items-center bg-white p-3 rounded border text-sm shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {b.banco_emissor || 'Banco'} - {b.numero_boleto}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(b.status_boleto)} text-white border-0`}
                          >
                            {b.status_boleto}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            Venc: {new Date(b.data_vencimento).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {b.url_boleto_pdf && (
                            <a
                              href={b.url_boleto_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 font-medium"
                            >
                              Ver PDF
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setParcelaForBoleto(p.id)
                              setBoletoEdit(b)
                              setIsBoletoOpen(true)
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
        {parcelas.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            Nenhuma parcela registrada para esta venda.
          </div>
        )}
      </div>

      <ParcelaDialog
        open={isParcelaOpen}
        onOpenChange={setIsParcelaOpen}
        vendaId={vendaId}
        editData={parcelaEdit}
      />
      <BoletoDialog
        open={isBoletoOpen}
        onOpenChange={setIsBoletoOpen}
        parcelaId={parcelaForBoleto!}
        editData={boletoEdit}
      />
    </div>
  )
}
