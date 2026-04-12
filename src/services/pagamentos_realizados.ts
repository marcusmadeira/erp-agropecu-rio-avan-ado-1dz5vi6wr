import pb from '@/lib/pocketbase/client'

export const getPagamentosRealizados = () =>
  pb.collection('pagamentos_realizados').getFullList({
    sort: '-data_pagamento',
    expand: 'boleto_pagar_id,boleto_pagar_id.fornecedor_id',
  })

export const createPagamentoRealizado = (data: FormData) =>
  pb.collection('pagamentos_realizados').create(data)

export const deletePagamentoRealizado = (id: string) =>
  pb.collection('pagamentos_realizados').delete(id)
