import pb from '@/lib/pocketbase/client'

export interface ManejoIatf {
  id: string
  matriz_id: string
  data_iatf: string
  touro_utilizado_id?: string
  resultado_dg?: 'Prenhe' | 'Vazia'
  data_provavel_parto_dpp?: string
  created: string
  updated: string
  expand?: {
    matriz_id?: { id_manejo_brinco: string; id: string }
    touro_utilizado_id?: { id_manejo_brinco: string; id: string }
  }
}

export const getIatfs = (options?: any) =>
  pb.collection('manejo_iatf_curral').getFullList<ManejoIatf>({
    expand: 'matriz_id,touro_utilizado_id',
    ...options,
  })

export const getIatf = (id: string) =>
  pb.collection('manejo_iatf_curral').getOne<ManejoIatf>(id, {
    expand: 'matriz_id,touro_utilizado_id',
  })

export const createIatf = (data: Partial<ManejoIatf>) =>
  pb.collection('manejo_iatf_curral').create<ManejoIatf>(data)

export const updateIatf = (id: string, data: Partial<ManejoIatf>) =>
  pb.collection('manejo_iatf_curral').update<ManejoIatf>(id, data)

export const deleteIatf = (id: string) => pb.collection('manejo_iatf_curral').delete(id)
