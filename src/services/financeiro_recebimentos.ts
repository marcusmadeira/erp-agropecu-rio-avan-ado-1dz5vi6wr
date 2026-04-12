import pb from '@/lib/pocketbase/client'

export const getBoletosCompletos = async () => {
  return pb.send('/backend/v1/boletos', { method: 'GET' })
}

export const getHistoricoCobrancas = async () => {
  return pb.collection('historico_cobrancas').getFullList({
    expand: 'cliente_id,boleto_id,usuario_id',
    sort: '-data_cobranca',
  })
}

export const registrarPagamento = async (id: string, data: any) => {
  return pb.send(`/backend/v1/boletos/${id}/pagar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const registrarHistoricoCobranca = async (data: any) => {
  return pb.collection('historico_cobrancas').create(data)
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

export const getConfiguracaoCobranca = async () => {
  try {
    return await pb.collection('configuracoes_cobranca').getFirstListItem('')
  } catch (err) {
    return null
  }
}

export const createBoleto = async (data: any) => pb.collection('boletos').create(data)
export const updateBoleto = async (id: string, data: any) =>
  pb.collection('boletos').update(id, data)
export const deleteBoleto = async (id: string) => pb.collection('boletos').delete(id)

export const getParceiros = async () =>
  pb.collection('parceiros_negocios').getFullList({ sort: 'nome_razao_social' })
export const getVendas = async () =>
  pb.collection('vendas').getFullList({ expand: 'cliente_id', sort: '-data_venda' })
export const getParcelas = async () =>
  pb
    .collection('parcelas_venda')
    .getFullList({ expand: 'venda_id,venda_id.cliente_id', sort: '-data_vencimento' })

export const obterInadimplencia = async () => {
  try {
    return await pb.send('/backend/v1/obter_inadimplencia', { method: 'GET' })
  } catch {
    return null
  }
}
