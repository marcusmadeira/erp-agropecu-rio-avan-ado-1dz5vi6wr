import pb from '@/lib/pocketbase/client'

export const getVenda = (id: string) =>
  pb.collection('vendas').getOne(id, { expand: 'cliente_id,evento_id' })

export const getItensVenda = (vendaId: string) =>
  pb
    .collection('itens_venda')
    .getFullList({ filter: `venda_id = '${vendaId}'`, expand: 'animal_id' })

export const getParcelas = (vendaId: string) =>
  pb
    .collection('parcelas_venda')
    .getFullList({ filter: `venda_id = '${vendaId}'`, sort: 'data_vencimento' })

export const createParcela = (data: any) => pb.collection('parcelas_venda').create(data)

export const updateParcela = (id: string, data: any) =>
  pb.collection('parcelas_venda').update(id, data)

export const deleteParcela = (id: string) => pb.collection('parcelas_venda').delete(id)

export const getBoletosDaVenda = (vendaId: string) =>
  pb
    .collection('boletos')
    .getFullList({
      filter: `venda_id = '${vendaId}' || parcela_id.venda_id = '${vendaId}'`,
      sort: 'data_vencimento',
    })

export const createBoleto = (data: any) => pb.collection('boletos').create(data)

export const updateBoleto = (id: string, data: any) => pb.collection('boletos').update(id, data)

export const deleteBoleto = (id: string) => pb.collection('boletos').delete(id)
