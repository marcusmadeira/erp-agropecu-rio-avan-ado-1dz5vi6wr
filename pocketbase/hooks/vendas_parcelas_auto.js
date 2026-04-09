onRecordAfterCreateSuccess((e) => {
  const venda = e.record
  const formaPagamento = venda.get('forma_pagamento')
  const valorTotal = venda.get('valor_total_venda')

  try {
    const parcelasCol = $app.findCollectionByNameOrId('parcelas_venda')
    const boletosCol = $app.findCollectionByNameOrId('boletos')

    let qtdParcelas = formaPagamento === 'Parcelado' ? 3 : 1
    let valorParcela = valorTotal / qtdParcelas

    for (let i = 1; i <= qtdParcelas; i++) {
      const parcela = new Record(parcelasCol)
      parcela.set('venda_id', venda.id)
      parcela.set('numero_parcela', i)
      parcela.set('valor_parcela', valorParcela)

      let vencimento = new Date()
      vencimento.setMonth(vencimento.getMonth() + i)
      parcela.set('data_vencimento', vencimento.toISOString())

      parcela.set('status_parcela', 'Pendente')
      parcela.set('dias_atraso', 0)

      $app.save(parcela)

      const boleto = new Record(boletosCol)
      boleto.set('parcela_id', parcela.id)
      boleto.set('numero_boleto', `BOL-${venda.id.substring(0, 5).toUpperCase()}-${i}`)
      boleto.set('valor_boleto', valorParcela)
      boleto.set('data_vencimento', vencimento.toISOString())
      boleto.set('status_boleto', 'Gerado')

      $app.save(boleto)
    }
  } catch (err) {
    console.log('Erro auto parcela e boleto:', err.message)
  }

  e.next()
}, 'vendas')
