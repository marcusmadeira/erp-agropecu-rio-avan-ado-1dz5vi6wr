import pb from '@/lib/pocketbase/client'

export const getAnimais = (options?: any) =>
  pb.collection('animais').getFullList({ expand: 'lote_atual', ...options })
export const createAnimal = (data: any) => pb.collection('animais').create(data)
export const updateAnimal = (id: string, data: any) => pb.collection('animais').update(id, data)
export const deleteAnimal = (id: string) => pb.collection('animais').delete(id)
