import pb from '@/lib/pocketbase/client'

export const updateUser = async (id: string, data: any) => {
  return pb.collection('users').update(id, data)
}
