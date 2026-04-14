import pb from '@/lib/pocketbase/client'

export interface AuditoriaMovimentacao {
  id: string
  usuario_id: string
  tipo_acao: string
  tabela_afetada: string
  registro_id: string
  dados_anteriores?: string
  dados_novos?: string
  user_email?: string
  user_role?: string
  description?: string
  ip_address?: string
  status?: string
  created: string
  updated: string
  expand?: {
    usuario_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getAuditoriasPaginated = async (page = 1, perPage = 20, options?: any) => {
  return pb.collection('auditoria_movimentacoes').getList<AuditoriaMovimentacao>(page, perPage, {
    expand: 'usuario_id',
    sort: '-created',
    ...options,
  })
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
