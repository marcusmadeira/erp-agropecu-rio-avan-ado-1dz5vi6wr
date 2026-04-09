import pb from '@/lib/pocketbase/client'

export const getParceiros = () => pb.collection('parceiros_negocios').getFullList()
export const createParceiro = (data: any) => pb.collection('parceiros_negocios').create(data)
export const updateParceiro = (id: string, data: any) =>
  pb.collection('parceiros_negocios').update(id, data)
export const deleteParceiro = (id: string) => pb.collection('parceiros_negocios').delete(id)
