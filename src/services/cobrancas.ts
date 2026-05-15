import pb from '@/lib/pocketbase/client'

export const getPainelCobrancaData = async () => {
  const parcelas = await pb.collection('parcelas_venda').getFullList({
    filter: "status_parcela = 'Pendente' || status_parcela = 'Atrasada'",
    expand: 'venda_id,venda_id.cliente_id',
    sort: 'data_vencimento',
  })

  const vendaIds = Array.from(new Set(parcelas.map((p) => p.venda_id).filter(Boolean)))
  const itens =
    vendaIds.length > 0
      ? await pb.collection('itens_venda').getFullList({
          filter: vendaIds.map((id) => `venda_id="${id}"`).join(' || '),
          expand: 'animal_id,lote_id',
        })
      : []

  const parcelaIds = parcelas.map((p) => p.id)
  const historicos =
    parcelaIds.length > 0
      ? await pb.collection('historico_cobrancas').getFullList({
          filter: parcelaIds.map((id) => `parcela_id="${id}"`).join(' || '),
          sort: '-data_cobranca',
        })
      : []

  return { parcelas, itens, historicos }
}

export const registrarAcaoCobranca = async (data: {
  parcela_id: string
  cliente_id: string
  tipo_cobranca: string
  status_cobranca: string
  mensagem_enviada?: string
  resultado?: string
}) => {
  const authId = pb.authStore.model?.id
  const result = await pb.collection('historico_cobrancas').create({
    ...data,
    data_cobranca: new Date().toISOString(),
    usuario_id: authId,
  })

  await pb
    .collection('auditoria_movimentacoes')
    .create({
      usuario_id: authId,
      tipo_acao: 'Criação',
      tabela_afetada: 'historico_cobrancas',
      registro_id: result.id,
      description: `Ação de cobrança registrada: ${data.status_cobranca}`,
    })
    .catch(() => {})

  return result
}

export const agendarProximaTentativa = async (parcela_id: string, data: string) => {
  const authId = pb.authStore.model?.id
  const result = await pb.collection('parcelas_venda').update(parcela_id, {
    data_proxima_tentativa: data,
  })

  await pb
    .collection('auditoria_movimentacoes')
    .create({
      usuario_id: authId,
      tipo_acao: 'Edição',
      tabela_afetada: 'parcelas_venda',
      registro_id: parcela_id,
      description: `Reagendamento de cobrança para: ${data}`,
    })
    .catch(() => {})

  return result
}

export const registrarBaixaManual = async (data: {
  parcela_id: string
  venda_id: string
  valor_pago: number
  data_pagamento: string
  forma_pagamento: string
  observacoes?: string
}) => {
  const authId = pb.authStore.model?.id
  const parcela = await pb.collection('parcelas_venda').update(data.parcela_id, {
    status_parcela: 'Paga',
    data_pagamento: data.data_pagamento,
    forma_pagamento: data.forma_pagamento,
  })

  await pb
    .collection('auditoria_movimentacoes')
    .create({
      usuario_id: authId,
      tipo_acao: 'Edição',
      tabela_afetada: 'parcelas_venda',
      registro_id: data.parcela_id,
      description: `Baixa manual de parcela no valor de ${data.valor_pago}`,
    })
    .catch(() => {})

  const rec = await pb.collection('recebimentos_vendas').create({
    parcela_id: data.parcela_id,
    venda_id: data.venda_id,
    data_recebimento: data.data_pagamento,
    valor_recebido: data.valor_pago,
    forma_recebimento: data.forma_pagamento,
    observacoes: data.observacoes,
    usuario_id: authId,
  })

  await pb
    .collection('auditoria_movimentacoes')
    .create({
      usuario_id: authId,
      tipo_acao: 'Criação',
      tabela_afetada: 'recebimentos_vendas',
      registro_id: rec.id,
      description: `Recebimento criado a partir de baixa manual de cobrança`,
    })
    .catch(() => {})

  return parcela
}
