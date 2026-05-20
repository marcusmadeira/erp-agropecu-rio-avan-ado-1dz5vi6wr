import pb from '@/lib/pocketbase/client'

export interface TransacaoFinanceira {
  id?: string
  data_competencia: string
  data_vencimento: string
  data_efetivacao_real?: string
  descricao_lancamento: string
  parceiro_id: string
  tipo_movimento: 'Receita' | 'Despesa'
  classificacao_custo: 'FIXA' | 'VARIÁVEL'
  centro_custo: 'CC01' | 'CC02' | 'CC03'
  valor_total: number
  status_pagamento: 'Pendente' | 'Recebido' | 'Atrasado'
  created?: string
  updated?: string
  expand?: {
    parceiro_id?: any
  }
}

export const getTransacoesFinanceiras = (options?: any) =>
  pb.collection('transacoes_financeiras').getFullList<TransacaoFinanceira>({
    expand: 'parceiro_id',
    sort: '-data_vencimento',
    ...options,
  })
export const getTransacaoFinanceira = (id: string) =>
  pb.collection('transacoes_financeiras').getOne<TransacaoFinanceira>(id, { expand: 'parceiro_id' })
export const createTransacaoFinanceira = (data: TransacaoFinanceira) =>
  pb.collection('transacoes_financeiras').create<TransacaoFinanceira>(data)
export const updateTransacaoFinanceira = (id: string, data: Partial<TransacaoFinanceira>) =>
  pb.collection('transacoes_financeiras').update<TransacaoFinanceira>(id, data)
export const deleteTransacaoFinanceira = (id: string) =>
  pb.collection('transacoes_financeiras').delete(id)
