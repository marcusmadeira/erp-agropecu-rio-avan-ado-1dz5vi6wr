import pb from '@/lib/pocketbase/client'

export interface CanecaSemen {
  id?: string
  numero_caneca: string
  doses_atuais?: number
  created?: string
  updated?: string
}

export const getCanecasList = () => pb.collection('canecas_semen').getFullList<CanecaSemen>()
