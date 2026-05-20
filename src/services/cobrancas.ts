import pb from '@/lib/pocketbase/client'

export const getPainelCobrancaData = async () => {
  const [parcelas, recebimentos] = await Promise.all([
    pb.collection('parcelas_venda').getFullList({
      expand: 'venda_id.cliente_id',
      sort: 'data_vencimento',
    }),
    pb.collection('recebimentos_vendas').getFullList(),
  ])

  const todayStr = new Date().toISOString().split('T')[0]
  const d7 = new Date()
  d7.setDate(d7.getDate() + 7)
  const d7Str = d7.toISOString().split('T')[0]

  const dashboard = {
    recebido: 0,
    aReceber: 0,
    vencido: 0,
    vencendo7Dias: 0,
  }

  recebimentos.forEach((r) => {
    dashboard.recebido += Number(r.valor_recebido) || 0
  })

  const pendentesPanel: any[] = []

  parcelas.forEach((p) => {
    const valorParcela = Number(p.valor_parcela) || 0
    if (p.status_parcela === 'Pendente' || p.status_parcela === 'Atrasada') {
      if (
        p.status_parcela === 'Atrasada' ||
        (p.status_parcela === 'Pendente' && p.data_vencimento < todayStr)
      ) {
        dashboard.vencido += valorParcela
      } else {
        dashboard.aReceber += valorParcela
        if (p.data_vencimento <= d7Str) {
          dashboard.vencendo7Dias += valorParcela
        }
      }
      pendentesPanel.push(p)
    }
  })

  const vendasIds = [...new Set(pendentesPanel.map((p) => p.venda_id))]
  const parcelasIds = pendentesPanel.map((p) => p.id)

  let itens: any[] = []
  if (vendasIds.length > 0) {
    itens = await pb.collection('itens_venda').getFullList({
      expand: 'animal_id,lote_id',
    })
  }

  let historicos: any[] = []
  if (parcelasIds.length > 0) {
    historicos = await pb.collection('historico_cobrancas').getFullList({
      sort: '-data_cobranca',
    })
  }

  return {
    dashboard,
    parcelas: pendentesPanel,
    itens: itens.filter((i) => vendasIds.includes(i.venda_id)),
    historicos: historicos.filter((h) => parcelasIds.includes(h.parcela_id)),
  }
}

export const registrarAcaoCobranca = async (data: any) => {
  const user = pb.authStore.record
  if (!user) throw new Error('Usuário não autenticado')

  const cobranca = await pb.collection('historico_cobrancas').create({
    data_cobranca: new Date().toISOString(),
    cliente_id: data.cliente_id,
    parcela_id: data.parcela_id,
    usuario_id: user.id,
    tipo_cobranca: data.tipo_cobranca,
    status_cobranca: data.status_cobranca,
    resultado: data.resultado,
  })

  await pb.collection('auditoria_movimentacoes').create({
    usuario_id: user.id,
    tipo_acao: 'Criação',
    tabela_afetada: 'historico_cobrancas',
    registro_id: cobranca.id,
    description: `Ação de cobrança registrada: ${data.tipo_cobranca} - ${data.status_cobranca}`,
  })
  return cobranca
}

export const agendarProximaTentativa = async (parcelaId: string, dataProx: string) => {
  const user = pb.authStore.record
  if (!user) throw new Error('Usuário não autenticado')

  const record = await pb.collection('parcelas_venda').update(parcelaId, {
    data_proxima_tentativa: dataProx,
  })

  await pb.collection('auditoria_movimentacoes').create({
    usuario_id: user.id,
    tipo_acao: 'Edição',
    tabela_afetada: 'parcelas_venda',
    registro_id: parcelaId,
    description: `Agendada próxima tentativa de cobrança para ${dataProx}`,
  })
  return record
}

export const registrarBaixaManual = async (data: any) => {
  const user = pb.authStore.record
  if (!user) throw new Error('Usuário não autenticado')

  const recebimento = await pb.collection('recebimentos_vendas').create({
    parcela_id: data.parcela_id,
    venda_id: data.venda_id,
    data_recebimento: data.data_pagamento,
    valor_recebido: data.valor_pago,
    forma_recebimento: data.forma_pagamento,
    observacoes: data.observacoes,
    usuario_id: user.id,
  })

  const parcela = await pb.collection('parcelas_venda').update(data.parcela_id, {
    status_parcela: 'Paga',
    data_pagamento: data.data_pagamento,
    forma_pagamento: data.forma_pagamento,
  })

  await pb.collection('auditoria_movimentacoes').create({
    usuario_id: user.id,
    tipo_acao: 'Edição',
    tabela_afetada: 'parcelas_venda',
    registro_id: data.parcela_id,
    description: `Baixa manual de parcela realizada. Forma: ${data.forma_pagamento}`,
  })

  return parcela
}
