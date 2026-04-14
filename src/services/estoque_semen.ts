import pb from '@/lib/pocketbase/client'

export interface EstoqueSemen {
  id?: string
  touro_doador: string
  botijao_armazenado?: string
  doses_palhetas_disponiveis: number
  touro_id?: string
  rgd?: string
  genealogia_pai?: string
  genealogia_mae?: string
  avaliacao_pmgz?: string
  caneca_id?: string
  created?: string
  updated?: string
  expand?: {
    touro_id?: any
    caneca_id?: any
  }
}

export const getEstoqueSemenList = () =>
  pb
    .collection('estoque_semen')
    .getFullList<EstoqueSemen>({ expand: 'touro_id,caneca_id', sort: '-created' })
export const getEstoqueSemen = (id: string) =>
  pb.collection('estoque_semen').getOne<EstoqueSemen>(id, { expand: 'touro_id,caneca_id' })
export const createEstoqueSemen = (data: Partial<EstoqueSemen>) =>
  pb.collection('estoque_semen').create<EstoqueSemen>(data)
export const updateEstoqueSemen = (id: string, data: Partial<EstoqueSemen>) =>
  pb.collection('estoque_semen').update<EstoqueSemen>(id, data)
export const deleteEstoqueSemen = (id: string) => pb.collection('estoque_semen').delete(id)
