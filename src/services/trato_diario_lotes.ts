import pb from '@/lib/pocketbase/client'

export interface TratoDiarioLote {
  id?: string
  data: string
  lote_id: string
  formulacao_id: string
  quantidade_kg_servida: number
  custo_total_trato?: number
  usuario_id?: string
  created?: string
  updated?: string
  expand?: any
}

export const getTratoDiarioLotes = (filter?: string) =>
  pb.collection('trato_diario_lotes').getFullList<TratoDiarioLote>({
    filter,
    expand: 'lote_id,formulacao_id',
    sort: '-data,-created',
  })
