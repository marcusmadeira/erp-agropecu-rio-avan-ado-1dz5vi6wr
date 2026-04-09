import pb from '@/lib/pocketbase/client'

export interface PlanejamentoAcasalamento {
  id: string
  matriz_id: string
  touro_opcao_1_id?: string
  touro_opcao_2_id?: string
  created: string
  updated: string
  expand?: {
    matriz_id?: { id_manejo_brinco: string; id: string }
    touro_opcao_1_id?: { id_manejo_brinco: string; id: string }
    touro_opcao_2_id?: { id_manejo_brinco: string; id: string }
  }
}

export const getPlanejamentos = () =>
  pb.collection('planejamento_acasalamento').getFullList<PlanejamentoAcasalamento>({
    expand: 'matriz_id,touro_opcao_1_id,touro_opcao_2_id',
  })

export const getPlanejamento = (id: string) =>
  pb.collection('planejamento_acasalamento').getOne<PlanejamentoAcasalamento>(id, {
    expand: 'matriz_id,touro_opcao_1_id,touro_opcao_2_id',
  })

export const createPlanejamento = (data: Partial<PlanejamentoAcasalamento>) =>
  pb.collection('planejamento_acasalamento').create<PlanejamentoAcasalamento>(data)

export const updatePlanejamento = (id: string, data: Partial<PlanejamentoAcasalamento>) =>
  pb.collection('planejamento_acasalamento').update<PlanejamentoAcasalamento>(id, data)

export const deletePlanejamento = (id: string) =>
  pb.collection('planejamento_acasalamento').delete(id)
