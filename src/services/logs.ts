import pb from '@/lib/pocketbase/client'

export interface LogSistema {
  id: string
  usuario_id?: string
  tipo_evento: 'Login' | 'Logout' | 'Erro' | 'Integração'
  descricao_evento: string
  status_evento: 'Sucesso' | 'Falha'
  created: string
  updated: string
}

export const getLogs = async (options?: any) => {
  return pb.collection('logs_sistema').getFullList<LogSistema>(options)
}

export const getLog = async (id: string, options?: any) => {
  return pb.collection('logs_sistema').getOne<LogSistema>(id, options)
}

export const createLog = async (data: Partial<LogSistema>) => {
  return pb.collection('logs_sistema').create<LogSistema>(data)
}
