import pb from '@/lib/pocketbase/client'

export interface EstoqueSemen {
  id?: string
  touro_doador: string
  botijao_armazenado?: string
  doses_palhetas_disponiveis: number
  created?: string
  updated?: string
}

export const getEstoqueSemenList = () => pb.collection('estoque_semen').getFullList<EstoqueSemen>()
export const getEstoqueSemen = (id: string) =>
  pb.collection('estoque_semen').getOne<EstoqueSemen>(id)
export const createEstoqueSemen = (data: EstoqueSemen) =>
  pb.collection('estoque_semen').create<EstoqueSemen>(data)
export const updateEstoqueSemen = (id: string, data: Partial<EstoqueSemen>) =>
  pb.collection('estoque_semen').update<EstoqueSemen>(id, data)
export const deleteEstoqueSemen = (id: string) => pb.collection('estoque_semen').delete(id)
