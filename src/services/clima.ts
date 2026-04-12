import pb from '@/lib/pocketbase/client'

export const getChuvas = () => pb.collection('registro_chuvas').getFullList({ sort: '-data_chuva' })
export const createChuva = (data: any) => pb.collection('registro_chuvas').create(data)
export const updateChuva = (id: string, data: any) =>
  pb.collection('registro_chuvas').update(id, data)
export const deleteChuva = (id: string) => pb.collection('registro_chuvas').delete(id)
