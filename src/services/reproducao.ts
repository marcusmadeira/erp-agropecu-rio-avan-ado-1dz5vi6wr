import pb from '@/lib/pocketbase/client'

export const getAnimais = () => pb.collection('animais').getFullList({ sort: 'id_manejo_brinco' })

// Planejamento
export const getPlanejamentos = () =>
  pb
    .collection('planejamento_acasalamento')
    .getFullList({ expand: 'matriz_id,touro_opcao_1_id,touro_opcao_2_id', sort: '-created' })
export const savePlanejamento = (id: string | null, data: any) => {
  if (id) return pb.collection('planejamento_acasalamento').update(id, data)
  return pb.collection('planejamento_acasalamento').create(data)
}
export const deletePlanejamento = (id: string) =>
  pb.collection('planejamento_acasalamento').delete(id)

// IATF
export const getIatfs = () =>
  pb
    .collection('manejo_iatf_curral')
    .getFullList({ expand: 'matriz_id,touro_utilizado_id', sort: '-data_iatf' })
export const saveIatf = (id: string | null, data: any) => {
  if (id) return pb.collection('manejo_iatf_curral').update(id, data)
  return pb.collection('manejo_iatf_curral').create(data)
}
export const deleteIatf = (id: string) => pb.collection('manejo_iatf_curral').delete(id)

// Nascimentos
export const getNascimentos = () =>
  pb
    .collection('nascimentos_e_desmama')
    .getFullList({ expand: 'matriz_mae_id', sort: '-data_nascimento' })
export const saveNascimento = (id: string | null, data: any) => {
  if (id) return pb.collection('nascimentos_e_desmama').update(id, data)
  return pb.collection('nascimentos_e_desmama').create(data)
}
export const deleteNascimento = (id: string) => pb.collection('nascimentos_e_desmama').delete(id)
