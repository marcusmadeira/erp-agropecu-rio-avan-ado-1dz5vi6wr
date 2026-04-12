import pb from '@/lib/pocketbase/client'

export const getRegistrosNascimento = () =>
  pb.collection('registro_nascimento').getFullList({ expand: 'vaca_mae_id', sort: '-created' })

export const getBezerros = () =>
  pb
    .collection('animais')
    .getFullList({ filter: "categoria='Bezerro' && status!='Descartado'", sort: '-created' })

export const getReclassificacoes = () =>
  pb.collection('reclassificacao_descarte').getFullList({ expand: 'animal_id', sort: '-data' })

export const createRegistroNascimento = async (data: any, animalData: any) => {
  const registro = await pb.collection('registro_nascimento').create(data)
  await pb.collection('animais').create(animalData)
  return registro
}

export const updateRegistroRGN = async (id: string, rgn: string) => {
  return pb.collection('registro_nascimento').update(id, {
    status_rgn: 'RGN Recebido',
    rgn_abcz: rgn,
  })
}

export const adicionarAoEstoque = async (registro: any) => {
  await pb.collection('registro_nascimento').update(registro.id, { status_rgn: 'Pronto Estoque' })
  try {
    const animal = await pb
      .collection('animais')
      .getFirstListItem(`id_manejo_brinco="${registro.numero_tatuagem}"`)
    await pb.collection('animais').update(animal.id, {
      status: 'Ativo',
      rgd_rgn_abcz: registro.rgn_abcz || '',
    })
  } catch (e) {
    console.error('Animal not found in stock to update', e)
  }
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
