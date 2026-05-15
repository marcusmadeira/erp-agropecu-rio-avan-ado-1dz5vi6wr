import pb from '@/lib/pocketbase/client'

export const getDespesas = () =>
  pb.collection('despesas').getFullList({ sort: '-data_despesa', expand: 'fornecedor_id' })

export const createDespesa = (data: any) => pb.collection('despesas').create(data)

export const updateDespesa = (id: string, data: any) => pb.collection('despesas').update(id, data)

export const deleteDespesa = (id: string) => pb.collection('despesas').delete(id)
