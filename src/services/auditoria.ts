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
  const movFilter = options?.filter || ''

  let logsFilter = movFilter
    .replace(/user_email/g, 'usuario_id.email')
    .replace(/tipo_acao/g, 'tipo_evento')
    .replace(/description/g, 'descricao_evento')
    .replace(/status/g, 'status_evento')
    .replace(/SUCCESS/g, 'Sucesso')
    .replace(/FAILED/g, 'Falha')
    .replace(/LOGIN/g, 'Login')
    .replace(/LOGOUT/g, 'Logout')

  if (logsFilter.includes('tabela_afetada')) {
    logsFilter = "id = 'none'"
  }

  const [movimentacoes, logs] = await Promise.all([
    pb
      .collection('auditoria_movimentacoes')
      .getList<AuditoriaMovimentacao>(1, 500, {
        expand: 'usuario_id',
        sort: '-created',
        filter: movFilter,
      })
      .catch(() => ({ items: [] as AuditoriaMovimentacao[], totalItems: 0 })),
    pb
      .collection('logs_sistema')
      .getList(1, 500, {
        expand: 'usuario_id',
        sort: '-created',
        filter: logsFilter,
      })
      .catch(() => ({ items: [] as any[], totalItems: 0 })),
  ])

  const allItems: any[] = [
    ...movimentacoes.items,
    ...logs.items.map((l: any) => ({
      id: l.id,
      usuario_id: l.usuario_id,
      tipo_acao:
        l.tipo_evento === 'Login' || l.tipo_evento === 'Logout'
          ? l.tipo_evento.toUpperCase()
          : 'SISTEMA',
      tabela_afetada: 'logs_sistema',
      registro_id: l.id,
      description: l.descricao_evento,
      status: l.status_evento === 'Sucesso' ? 'SUCCESS' : 'FAILED',
      created: l.created,
      updated: l.updated,
      expand: l.expand,
    })),
  ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  const totalItems = allItems.length
  const totalPages = Math.ceil(totalItems / perPage) || 1
  const start = (page - 1) * perPage
  const items = allItems.slice(start, start + perPage)

  return { items, totalItems, totalPages }
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
