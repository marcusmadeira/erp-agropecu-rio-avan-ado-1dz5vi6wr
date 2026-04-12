import pb from '@/lib/pocketbase/client'

export const getMetas = async () => {
  return pb.collection('metas').getFullList({ sort: '-created' })
}

export const createMeta = async (data: any) => {
  return pb.collection('metas').create(data)
}

export const updateMeta = async (id: string, data: any) => {
  return pb.collection('metas').update(id, data)
}

export const deleteMeta = async (id: string) => {
  return pb.collection('metas').delete(id)
}
