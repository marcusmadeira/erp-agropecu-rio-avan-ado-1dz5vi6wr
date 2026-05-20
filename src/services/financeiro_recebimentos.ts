import pb from '@/lib/pocketbase/client'

export const getBoletosCompletos = async () => {
  try {
    const boletos = await pb.collection('boletos').getFullList({
      expand:
        'parcela_id,parcela_id.venda_id,parcela_id.venda_id.cliente_id,venda_id,venda_id.cliente_id',
      sort: '-data_vencimento',
    })
    if (boletos.length > 0) return boletos
    return pb.send('/backend/v1/boletos', { method: 'GET' }).catch(() => [])
  } catch {
    return []
  }
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
    const parcelas = await pb
      .collection('parcelas_venda')
      .getFullList({ expand: 'venda_id,venda_id.cliente_id' })
    let recebido = 0
    let aReceber = 0
    let atrasado = 0

    const now = new Date().getTime()

    parcelas.forEach((p) => {
      const val = Number(p.valor_parcela) || 0
      if (p.status_parcela === 'Paga') {
        recebido += val
      } else if (p.status_parcela === 'Atrasada') {
        atrasado += val
      } else if (p.status_parcela === 'Pendente') {
        const venc = new Date(p.data_vencimento).getTime()
        if (venc < now) {
          atrasado += val
        } else {
          aReceber += val
        }
      }
    })

    const overdueList = parcelas
      .filter(
        (p) =>
          p.status_parcela === 'Atrasada' ||
          (p.status_parcela === 'Pendente' && new Date(p.data_vencimento).getTime() < now),
      )
      .map((p) => ({
        id: p.id,
        clienteNome: p.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'Desconhecido',
        clientePhone: p.expand?.venda_id?.expand?.cliente_id?.contato_whatsapp || '',
        vencimento: p.data_vencimento,
        diasAtraso: Math.floor(
          (now - new Date(p.data_vencimento).getTime()) / (1000 * 60 * 60 * 24),
        ),
        valor: Number(p.valor_parcela) || 0,
        parcela_id: p.id,
        venda_id: p.venda_id,
      }))

    return {
      recebido,
      aReceber,
      atrasado,
      total: recebido + aReceber + atrasado,
      overdueList: overdueList.sort((a, b) => b.diasAtraso - a.diasAtraso),
    }
  } catch (err) {
    try {
      return await pb.send('/backend/v1/obter_inadimplencia', { method: 'GET' })
    } catch {
      return null
    }
  }
}
