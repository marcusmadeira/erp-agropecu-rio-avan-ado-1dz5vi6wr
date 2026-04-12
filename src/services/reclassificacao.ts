import pb from '@/lib/pocketbase/client'

export const getReclassificacoes = (options?: any) =>
  pb
    .collection('reclassificacao_descarte')
    .getFullList({ expand: 'animal_id,novo_lote_destino_id', ...options })
export const getReclassificacoesByAnimal = (animalId: string) =>
  pb.collection('reclassificacao_descarte').getFullList({
    filter: `animal_id = "${animalId}"`,
    expand: 'novo_lote_destino_id',
    sort: '-data',
  })
export const createReclassificacao = (data: any) =>
  pb.collection('reclassificacao_descarte').create(data)
