import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Calendar, DollarSign, Clock, MessageSquare, ExternalLink } from 'lucide-react'
import { differenceInDays, startOfDay } from 'date-fns'
import { Link } from 'react-router-dom'
import { AcaoCobrancaModal } from '@/components/cobrancas/AcaoCobrancaModal'
import { BaixaManualModal } from '@/components/cobrancas/BaixaManualModal'
import { AgendarTentativaModal } from '@/components/cobrancas/AgendarTentativaModal'

interface Props {
  parcela: any
  itens: any[]
  historicos: any[]
  onRefresh: () => void
}

export function ParcelaCard({ parcela, itens, historicos, onRefresh }: Props) {
  const cliente = parcela.expand?.venda_id?.expand?.cliente_id
  const fone = cliente?.contato_whatsapp || cliente?.contato_whatsapp_cobranca || 'N/A'

  const diasAtraso = differenceInDays(
    startOfDay(new Date()),
    startOfDay(new Date(parcela.data_vencimento)),
  )
  const lastAction = historicos.length > 0 ? historicos[0] : null

  const itemsDesc = itens
    .map((i) => i.expand?.animal_id?.id_manejo_brinco || i.expand?.lote_id?.nome_lote || 'Item')
    .join(', ')

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start mb-2">
          <Link
            to={`/vendas/geral/${parcela.venda_id}`}
            className="text-sm text-emerald-600 hover:underline flex items-center gap-1 font-medium"
          >
            Venda #{parcela.venda_id.substring(0, 5)} <ExternalLink className="h-3 w-3" />
          </Link>
          <Badge variant={diasAtraso > 0 ? 'destructive' : 'secondary'}>
            {diasAtraso > 0 ? `${diasAtraso} dias atraso` : 'No prazo'}
          </Badge>
        </div>

        <div className="mb-4">
          <Link
            to={`/parceiros/${cliente?.id}`}
            className="font-bold text-lg text-gray-800 line-clamp-1 hover:underline"
          >
            {cliente?.nome_razao_social || 'Desconhecido'}
          </Link>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Phone className="h-3.5 w-3.5" /> {fone}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> Valor
            </span>
            <span className="font-semibold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                parcela.valor_parcela,
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Vencimento
            </span>
            <span>{new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</span>
          </div>
          {parcela.data_proxima_tentativa && (
            <div className="flex justify-between text-blue-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Próx. Tentativa
              </span>
              <span>{new Date(parcela.data_proxima_tentativa).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded line-clamp-2">
            <strong>Itens:</strong> {itemsDesc || 'Nenhum item'}
          </div>

          {lastAction && (
            <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded flex gap-1 items-start mt-2">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <strong>Última ação:</strong> {lastAction.status_cobranca} em{' '}
                {new Date(lastAction.data_cobranca).toLocaleDateString('pt-BR')}
                {lastAction.resultado && (
                  <span className="block mt-0.5 opacity-80">{lastAction.resultado}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 grid grid-cols-3 gap-2 border-t mt-auto">
        <AcaoCobrancaModal parcela={parcela} clienteId={cliente?.id} onRefresh={onRefresh} />
        <AgendarTentativaModal parcelaId={parcela.id} onRefresh={onRefresh} />
        <BaixaManualModal parcela={parcela} onRefresh={onRefresh} />
      </CardFooter>
    </Card>
  )
}
