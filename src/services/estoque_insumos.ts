import pb from '@/lib/pocketbase/client'

export interface EstoqueInsumo {
  id: string
  produto: string
  quantidade_atual: number
  unidade_medida: string
  custo_medio_unitario: number
  categoria: string
}

export const getInsumos = () => {
  return pb.collection('estoque_insumos').getFullList<EstoqueInsumo>({
    sort: 'produto',
  })
}
