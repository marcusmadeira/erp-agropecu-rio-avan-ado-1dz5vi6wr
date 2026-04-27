import pb from '@/lib/pocketbase/client'

export const getPastos = () => pb.collection('pastos_e_piquetes').getFullList({ sort: 'nome' })
export const createPasto = (data: any) => pb.collection('pastos_e_piquetes').create(data)
export const updatePasto = (id: string, data: any) =>
  pb.collection('pastos_e_piquetes').update(id, data)
export const deletePasto = (id: string) => pb.collection('pastos_e_piquetes').delete(id)
