import pb from '@/lib/pocketbase/client'

export interface Notificacao {
  id: string
  usuario_id: string
  tipo_alerta:
    | 'Estoque Crítico'
    | 'Prenhez Confirmada'
    | 'Pesagem Registrada'
    | 'Transação Pendente'
    | 'Erro Sistema'
  descricao: string
  lido: boolean
  created: string
  updated: string
}

export const getNotificacoes = async () => {
  return pb.collection('notificacoes').getFullList<Notificacao>({
    sort: '-created',
  })
}

export const markAsRead = async (id: string) => {
  return pb.collection('notificacoes').update<Notificacao>(id, { lido: true })
}

export const clearAllNotificacoes = async (userId: string) => {
  const list = await pb
    .collection('notificacoes')
    .getFullList({ filter: `usuario_id = "${userId}"` })
  await Promise.all(list.map((n) => pb.collection('notificacoes').delete(n.id)))
}
