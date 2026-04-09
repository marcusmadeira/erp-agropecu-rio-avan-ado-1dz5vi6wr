import pb from '@/lib/pocketbase/client'

export interface EstoqueInsumo {
  id?: string
  produto: string
  quantidade_atual: number
  unidade_medida: string
  custo_medio_unitario?: number
  estoque_minimo_critico?: number
  consumo_medio_diario?: number
  created?: string
  updated?: string
}

export const getEstoqueInsumos = () => pb.collection('estoque_insumos').getFullList<EstoqueInsumo>()
export const getEstoqueInsumo = (id: string) =>
  pb.collection('estoque_insumos').getOne<EstoqueInsumo>(id)
export const createEstoqueInsumo = (data: EstoqueInsumo) =>
  pb.collection('estoque_insumos').create<EstoqueInsumo>(data)
export const updateEstoqueInsumo = (id: string, data: Partial<EstoqueInsumo>) =>
  pb.collection('estoque_insumos').update<EstoqueInsumo>(id, data)
export const deleteEstoqueInsumo = (id: string) => pb.collection('estoque_insumos').delete(id)
