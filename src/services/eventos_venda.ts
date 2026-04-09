import pb from '@/lib/pocketbase/client'

export const getEventosVenda = async () => {
  return pb.collection('eventos_venda').getFullList({ sort: '-data_evento' })
}

export const getEventoVenda = async (id: string) => {
  return pb.collection('eventos_venda').getOne(id)
}

export const createEventoVenda = async (data: any) => {
  return pb.collection('eventos_venda').create(data)
}

export const updateEventoVenda = async (id: string, data: any) => {
  return pb.collection('eventos_venda').update(id, data)
}

export const deleteEventoVenda = async (id: string) => {
  return pb.collection('eventos_venda').delete(id)
}

export const getCustosEvento = async (eventoId: string) => {
  return pb.collection('custos_evento').getFullList({
    filter: `evento_id = '${eventoId}'`,
    sort: '-data_custo',
  })
}

export const createCustoEvento = async (data: any) => {
  return pb.collection('custos_evento').create(data)
}

export const deleteCustoEvento = async (id: string) => {
  return pb.collection('custos_evento').delete(id)
}
