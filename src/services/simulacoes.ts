import pb from '@/lib/pocketbase/client'

export const getSimulacoes = () =>
  pb.collection('simulacoes_cenarios').getFullList({ sort: '-created' })
export const getSimulacao = (id: string) => pb.collection('simulacoes_cenarios').getOne(id)
export const createSimulacao = (data: any) => pb.collection('simulacoes_cenarios').create(data)
export const deleteSimulacao = (id: string) => pb.collection('simulacoes_cenarios').delete(id)
