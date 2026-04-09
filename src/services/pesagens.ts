import pb from '@/lib/pocketbase/client'

export interface PesagemDiaria {
  id: string
  animal_id: string
  data_pesagem: string
  peso_kg: number
  responsavel_pesagem?: string
  observacoes?: string
  created: string
  updated: string
}

export const getPesagens = async (options?: any) => {
  return pb.collection('pesagens_diarias').getFullList<PesagemDiaria>(options)
}

export const getPesagem = async (id: string, options?: any) => {
  return pb.collection('pesagens_diarias').getOne<PesagemDiaria>(id, options)
}

export const createPesagem = async (data: Partial<PesagemDiaria>) => {
  return pb.collection('pesagens_diarias').create<PesagemDiaria>(data)
}

export const updatePesagem = async (id: string, data: Partial<PesagemDiaria>) => {
  return pb.collection('pesagens_diarias').update<PesagemDiaria>(id, data)
}

export const deletePesagem = async (id: string) => {
  return pb.collection('pesagens_diarias').delete(id)
}
