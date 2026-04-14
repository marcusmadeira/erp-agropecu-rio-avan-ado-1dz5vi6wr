import pb from '@/lib/pocketbase/client'

export interface EstoqueMovimentacao {
  id?: string
  tipo: 'ENTRADA_NOTA_FISCAL' | 'ENTRADA_MANUAL' | 'SAIDA_RACAO' | 'PRODUCAO_RACAO'
  produto_id: string
  quantidade: number
  valor_unitario?: number
  valor_total?: number
  fornecedor?: string
  nota_fiscal?: string
  data: string
  usuario_id: string
  created?: string
  updated?: string
  expand?: any
}

export const getEstoqueMovimentacoes = (filter?: string) =>
  pb.collection('estoque_movimentacoes').getFullList<EstoqueMovimentacao>({
    filter,
    expand: 'produto_id,usuario_id,racao_id',
    sort: '-data,-created',
  })

export const createEstoqueMovimentacao = (data: EstoqueMovimentacao) =>
  pb.collection('estoque_movimentacoes').create<EstoqueMovimentacao>(data)
