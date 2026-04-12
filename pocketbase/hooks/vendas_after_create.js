onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const status = record.get('status_venda')
  const eventoId = record.get('evento_id')

  if (eventoId && (status === 'Confirmada' || status === 'Entregue')) {
    try {
      const evento = $app.findRecordById('eventos_venda', eventoId)
      const vendasEvento = $app.findRecordsByFilter(
        'vendas',
        "evento_id = {:eventoId} && (status_venda = 'Confirmada' || status_venda = 'Entregue')",
        '',
        0,
        0,
        { eventoId: eventoId },
      )
      let receita = 0
      for (let i = 0; i < vendasEvento.length; i++) {
        receita += vendasEvento[i].get('valor_total_venda') || 0
      }
      evento.set('receita_total_evento', receita)
      $app.save(evento)
    } catch (err) {}
  }

  if (status === 'Entregue') {
    try {
      const itens = $app.findRecordsByFilter('itens_venda', 'venda_id = {:vendaId}', '', 0, 0, {
        vendaId: record.get('id'),
      })
      for (let i = 0; i < itens.length; i++) {
        const animalId = itens[i].get('animal_id')
        if (animalId) {
          try {
            const animal = $app.findRecordById('animais', animalId)
            if (animal.get('status') !== 'Vendido') {
              animal.set('status', 'Vendido')
              $app.save(animal)
            }
          } catch (err) {}
        }
      }
    } catch (err) {}
  }

  // Automação Financeira: Criação de Transação, Parcelas e Boletos
  try {
    const valorTotal = record.get('valor_total_venda') || 0
    const numParcelas = record.get('numero_parcelas') || 1
    const clienteId = record.get('cliente_id')
    const tipoGado = record.get('tipo_gado') || 'Comercial'
    const dataVenda = record.get('data_venda') || new Date().toISOString()
    const formaPagamento = record.get('forma_pagamento') || 'AVista'

    const centroCusto = tipoGado === 'PO' ? 'CC01' : 'CC02'

    // Criar Transação de Receita
    const transacoesCol = $app.findCollectionByNameOrId('transacoes_financeiras')
    const transacao = new Record(transacoesCol)
    transacao.set('data_competencia', dataVenda)
    transacao.set('data_vencimento', dataVenda)
    transacao.set('descricao_lancamento', `Receita Venda ${record.id}`)
    transacao.set('parceiro_id', clienteId)
    transacao.set('tipo_movimento', 'Receita')
    transacao.set('classificacao_custo', 'VARIÁVEL')
    transacao.set('centro_custo', centroCusto)
    transacao.set('valor_total', valorTotal)
    transacao.set('status_pagamento', 'Pendente')
    $app.save(transacao)

    // Criar Parcelas e Boletos Correspondentes
    const parcelasCol = $app.findCollectionByNameOrId('parcelas_venda')
    const boletosCol = $app.findCollectionByNameOrId('boletos')
    const valorParcela = valorTotal / numParcelas

    for (let i = 1; i <= numParcelas; i++) {
      const parcela = new Record(parcelasCol)
      parcela.set('venda_id', record.id)
      parcela.set('numero_parcela', i)
      parcela.set('valor_parcela', valorParcela)

      let vDate = new Date(dataVenda)
      if (formaPagamento === 'Parcelado') {
        vDate.setDate(vDate.getDate() + 30 * i)
      }
      parcela.set('data_vencimento', vDate.toISOString())
      parcela.set('status_parcela', 'Pendente')
      $app.save(parcela)

      const boleto = new Record(boletosCol)
      boleto.set('parcela_id', parcela.id)
      const randomNum = Math.floor(Math.random() * 1000000)
      boleto.set('numero_boleto', `BOL-${record.id}-${i}-${randomNum}`)
      boleto.set('data_emissao', dataVenda)
      boleto.set('data_vencimento', vDate.toISOString())
      boleto.set('valor_boleto', valorParcela)
      boleto.set('status_boleto', 'Gerado')
      $app.save(boleto)
    }
  } catch (err) {
    console.log('Erro ao gerar registros financeiros da venda:', err.message)
  }

  e.next()
}, 'vendas')
