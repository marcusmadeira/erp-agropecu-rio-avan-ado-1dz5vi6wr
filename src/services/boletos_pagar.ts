import pb from '@/lib/pocketbase/client'

export const getBoletosPagar = () =>
  pb
    .collection('boletos_pagar')
    .getFullList({ sort: '-data_vencimento', expand: 'despesa_id,fornecedor_id' })

export const createBoletoPagar = (data: any) => pb.collection('boletos_pagar').create(data)

export const updateBoletoPagar = (id: string, data: any) =>
  pb.collection('boletos_pagar').update(id, data)

export const deleteBoletoPagar = (id: string) => pb.collection('boletos_pagar').delete(id)
