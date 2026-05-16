import pb from '@/lib/pocketbase/client'

export interface PlanejamentoCompra {
  id?: string
  insumo_id: string
  quantidade_sugerida: number
  prioridade?: string
  status: string
  valor_estimado?: number
  observacoes?: string
  usuario_id?: string
  created?: string
  updated?: string
  expand?: any
}

export const getPlanejamentosAtivos = () => {
  return pb.collection('planejamento_compras').getFullList<PlanejamentoCompra>({
    filter: 'status != "Recebido"',
    expand: 'insumo_id,usuario_id',
  })
}

export const createPlanejamento = (data: Partial<PlanejamentoCompra>) => {
  return pb.collection('planejamento_compras').create<PlanejamentoCompra>(data)
}

export const updatePlanejamento = (id: string, data: Partial<PlanejamentoCompra>) => {
  return pb.collection('planejamento_compras').update<PlanejamentoCompra>(id, data)
}
