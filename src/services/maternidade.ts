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
  // Cria o animal primeiro para garantir que a tag (id_manejo_brinco) seja única.
  // Se falhar (ex: brinco já existe), já aborta antes de criar o nascimento.
  const animalPayload: any = {
    id_manejo_brinco: data.rgn_provisorio_abcz,
    mae_id: data.matriz_mae_id,
    data_nascimento: data.data_nascimento,
    sexo: data.sexo,
    categoria: 'Bezerro',
    status: 'Ativo',
  }

  if (data.lote_atual_id) {
    animalPayload.lote_atual_id = data.lote_atual_id
  }
  if (data.peso_nascer) {
    animalPayload.peso_atual_kg = data.peso_nascer
  }

  const animal = await pb.collection('animais').create(animalPayload)

  try {
    const nascimentoPayload = {
      matriz_mae_id: data.matriz_mae_id,
      data_nascimento: data.data_nascimento,
      sexo: data.sexo,
      peso_nascer: data.peso_nascer,
      rgn_provisorio_abcz: data.rgn_provisorio_abcz,
      status_cria: 'Ativo',
    }
    const nascimento = await pb.collection('nascimentos_e_desmama').create(nascimentoPayload)
    return nascimento
  } catch (e) {
    // Tentativa de rollback para evitar registro órfão
    await pb
      .collection('animais')
      .delete(animal.id)
      .catch(() => {})
    throw e
  }
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
