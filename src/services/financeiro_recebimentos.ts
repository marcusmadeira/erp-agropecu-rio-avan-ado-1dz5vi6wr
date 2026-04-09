import pb from '@/lib/pocketbase/client'

export const getBoletosCompletos = async () => {
  return pb.collection('boletos').getFullList({
    expand: 'parcela_id,parcela_id.venda_id,parcela_id.venda_id.cliente_id',
    sort: '-data_vencimento',
  })
}

export const getHistoricoCobrancas = async () => {
  return pb.collection('historico_cobrancas').getFullList({
    expand: 'cliente_id,boleto_id',
    sort: '-data',
  })
}

export const registrarPagamento = async (id: string, data: any) => {
  return pb.send(`/backend/v1/boletos/${id}/pagar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const registrarHistoricoCobranca = async (id: string, data: any) => {
  return pb.send(`/backend/v1/boletos/${id}/historico-cobranca`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const cancelarBoleto = async (id: string) => {
  return pb.collection('boletos').update(id, { status_boleto: 'Cancelado' })
}

export const renegociarBoleto = async (id: string, data: any) => {
  return pb.send(`/backend/v1/boletos/${id}/renegociar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
