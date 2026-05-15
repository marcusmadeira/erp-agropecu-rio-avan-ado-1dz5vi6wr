import pb from '@/lib/pocketbase/client'

export const getAnimais = () => pb.collection('animais').getFullList({ sort: 'id_manejo_brinco' })
export const getAnimaisFemeas = () =>
  pb.collection('animais').getFullList({ filter: 'sexo = "Fêmea"', sort: 'id_manejo_brinco' })
export const getAnimaisTouros = () =>
  pb
    .collection('animais')
    .getFullList({ filter: 'sexo = "Macho" && categoria ~ "Touro"', sort: 'id_manejo_brinco' })
export const getLotes = () => pb.collection('lotes').getFullList({ sort: 'nome_lote' })

export const getEstacoes = () =>
  pb.collection('estacao_monta').getFullList({ sort: '-data_inicio' })
export const saveEstacao = (id: string | null, data: any) => {
  if (id) return pb.collection('estacao_monta').update(id, data)
  return pb.collection('estacao_monta').create(data)
}
export const deleteEstacao = (id: string) => pb.collection('estacao_monta').delete(id)

export const getRepasses = () =>
  pb
    .collection('repasse_monta_natural')
    .getFullList({ expand: 'lote_vinculado_id,touro_repasse_id', sort: '-data_entrada' })
export const saveRepasse = (id: string | null, data: any) => {
  if (id) return pb.collection('repasse_monta_natural').update(id, data)
  return pb.collection('repasse_monta_natural').create(data)
}
export const deleteRepasse = (id: string) => pb.collection('repasse_monta_natural').delete(id)

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

export const getIatfs = () =>
  pb
    .collection('manejo_iatf_curral')
    .getFullList({ expand: 'matriz_id,touro_utilizado_id', sort: '-data_iatf' })
export const saveIatf = (id: string | null, data: any) => {
  if (id) return pb.collection('manejo_iatf_curral').update(id, data)
  return pb.collection('manejo_iatf_curral').create(data)
}
export const deleteIatf = (id: string) => pb.collection('manejo_iatf_curral').delete(id)

export const getRegistrosNascimento = async () => {
  const records = await pb
    .collection('nascimentos_e_desmama')
    .getFullList({ expand: 'matriz_mae_id', sort: '-data_nascimento' })
  return records.map((r) => ({
    ...r,
    vaca_mae_id: r.matriz_mae_id,
    expand: {
      ...r.expand,
      vaca_mae_id: r.expand?.matriz_mae_id,
    },
  }))
}
export const saveRegistroNascimento = (id: string | null, data: any) => {
  const payload = { ...data }
  if (payload.vaca_mae_id) {
    payload.matriz_mae_id = payload.vaca_mae_id
    delete payload.vaca_mae_id
  }
  if (id) return pb.collection('nascimentos_e_desmama').update(id, payload)
  return pb.collection('nascimentos_e_desmama').create(payload)
}
export const deleteRegistroNascimento = (id: string) =>
  pb.collection('nascimentos_e_desmama').delete(id)

export const saveReclassificacao = (data: any) =>
  pb.collection('reclassificacao_descarte').create(data)
export const updateAnimal = (id: string, data: any) => pb.collection('animais').update(id, data)
export const createAnimal = (data: any) => pb.collection('animais').create(data)
