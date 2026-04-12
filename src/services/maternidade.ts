import pb from '@/lib/pocketbase/client'

export const getRegistrosNascimento = () =>
  pb.collection('registro_nascimento').getFullList({ expand: 'vaca_mae_id', sort: '-created' })

export const getBezerros = () =>
  pb
    .collection('animais')
    .getFullList({ filter: "categoria='Bezerro' && status!='Descartado'", sort: '-created' })

export const getReclassificacoes = () =>
  pb.collection('reclassificacao_descarte').getFullList({ expand: 'animal_id', sort: '-data' })

export const createRegistroNascimento = async (data: any, animalData?: any) => {
  return pb.send('/backend/v1/maternidade/nascimento', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const updateRegistroRGN = async (id: string, rgn: string) => {
  return pb.send(`/backend/v1/maternidade/rgn/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ rgn_abcz: rgn }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const adicionarAoEstoque = async (registro: any) => {
  return pb.send('/backend/v1/maternidade/estoque', {
    method: 'POST',
    body: JSON.stringify({ registro_id: registro.id }),
    headers: { 'Content-Type': 'application/json' },
  })
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
