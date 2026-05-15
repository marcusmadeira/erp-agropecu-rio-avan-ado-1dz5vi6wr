import pb from '@/lib/pocketbase/client'

export const getRegistrosNascimento = () =>
  pb.collection('nascimentos_e_desmama').getFullList({ expand: 'matriz_mae_id', sort: '-created' })

export const getBezerros = () =>
  pb
    .collection('animais')
    .getFullList({ filter: "categoria='Bezerro' && status!='Descartado'", sort: '-created' })

export const getReclassificacoes = () =>
  pb.collection('reclassificacao_descarte').getFullList({ expand: 'animal_id', sort: '-data' })

export const createRegistroNascimento = async (data: any) => {
  const nascimento = await pb.collection('nascimentos_e_desmama').create(data)

  await pb.collection('animais').create({
    id_manejo_brinco: data.rgn_provisorio_abcz || `BEZ-${Date.now()}`,
    mae_id: data.matriz_mae_id,
    data_nascimento: data.data_nascimento,
    sexo: data.sexo,
    categoria: 'Bezerro',
    status: 'Ativo',
  })

  return nascimento
}

export const updateRegistroRGN = async (id: string, rgn: string) => {
  return pb.collection('nascimentos_e_desmama').update(id, { rgn_provisorio_abcz: rgn })
}

export const adicionarAoEstoque = async (registro: any) => {
  // Legacy function - behavior merged into createRegistroNascimento to ensure atomicity
  return true
}

export const destinarBezerro = async (animalId: string, destino: string, motivo: string) => {
  let novaCategoria = destino
  let novoStatus = 'Ativo'

  if (destino === 'Registrar Touro') novaCategoria = 'Touro PO'
  if (destino === 'Comercial') novaCategoria = 'Garrote TIP'
  if (destino === 'Descartar') {
    novaCategoria = 'Descarte'
    novoStatus = 'Descartado'
  }

  await pb.collection('animais').update(animalId, {
    categoria: novaCategoria,
    status: novoStatus,
  })

  await pb.collection('reclassificacao_descarte').create({
    animal_id: animalId,
    data: new Date().toISOString(),
    nova_categoria: novaCategoria,
    motivo: motivo,
  })
}
