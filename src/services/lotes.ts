import pb from '@/lib/pocketbase/client'

export const getLotes = () => pb.collection('lotes').getFullList()
export const createLote = (data: any) => pb.collection('lotes').create(data)
export const updateLote = (id: string, data: any) => pb.collection('lotes').update(id, data)
export const deleteLote = (id: string) => pb.collection('lotes').delete(id)
