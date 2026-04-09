import pb from '@/lib/pocketbase/client'

export const getPastos = () => pb.collection('pastos_e_piquetes').getFullList()
