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

export const getEstoqueInsumos = () => {
  return pb.collection('estoque_insumos').getFullList<EstoqueInsumo>({
    sort: 'produto',
  })
}

export const getEstoqueInsumo = (id: string) => {
  return pb.collection('estoque_insumos').getOne<EstoqueInsumo>(id)
}

export const createEstoqueInsumo = (data: Partial<EstoqueInsumo>) => {
  return pb.collection('estoque_insumos').create<EstoqueInsumo>(data)
}

export const updateEstoqueInsumo = (id: string, data: Partial<EstoqueInsumo>) => {
  return pb.collection('estoque_insumos').update<EstoqueInsumo>(id, data)
}
