import pb from '@/lib/pocketbase/client'

export interface AuditoriaMovimentacao {
  id: string
  usuario_id: string
  tipo_acao: 'Criação' | 'Edição' | 'Exclusão'
  tabela_afetada: string
  registro_id: string
  dados_anteriores?: string
  dados_novos?: string
  created: string
  updated: string
}

export const getAuditorias = async (options?: any) => {
  return pb.collection('auditoria_movimentacoes').getFullList<AuditoriaMovimentacao>(options)
}

export const getAuditoria = async (id: string, options?: any) => {
  return pb.collection('auditoria_movimentacoes').getOne<AuditoriaMovimentacao>(id, options)
}

export const createAuditoria = async (data: Partial<AuditoriaMovimentacao>) => {
  return pb.collection('auditoria_movimentacoes').create<AuditoriaMovimentacao>(data)
}
