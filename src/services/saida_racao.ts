import pb from '@/lib/pocketbase/client'

export interface SaidaRacaoData {
  lote_id: string
  formulacao_id: string
  quantidade_kg: number
  data: string
  observacoes?: string
}

export const registrarSaidaRacao = async (data: SaidaRacaoData) => {
  return pb.send('/backend/v1/saida-racao', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const getHistoricoSaidaRacao = async (loteId?: string) => {
  const filter = loteId ? `lote_id = "${loteId}"` : ''
  return pb.collection('trato_diario_lotes').getFullList({
    filter,
    expand: 'formulacao_id,usuario_id',
    sort: '-data,-created',
  })
}
