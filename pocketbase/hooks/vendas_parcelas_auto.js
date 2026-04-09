onRecordAfterCreateSuccess((e) => {
  const venda = e.record
  const formaPagamento = venda.get('forma_pagamento')
  const valorTotal = venda.get('valor_total_venda')
  const numeroParcelas = venda.get('numero_parcelas')

  try {
    const parcelasCol = $app.findCollectionByNameOrId('parcelas_venda')
    const boletosCol = $app.findCollectionByNameOrId('boletos')

    let qtdParcelas = numeroParcelas > 0 ? numeroParcelas : formaPagamento === 'Parcelado' ? 3 : 1

    // Calculates the base value truncating to 2 decimals
    let valorParcelaBase = Math.floor((valorTotal / qtdParcelas) * 100) / 100

    // The last installment absorbs any rounding differences
    let valorUltimaParcela = valorTotal - valorParcelaBase * (qtdParcelas - 1)
    valorUltimaParcela = Math.round(valorUltimaParcela * 100) / 100

    for (let i = 1; i <= qtdParcelas; i++) {
      const valorAtual = i === qtdParcelas ? valorUltimaParcela : valorParcelaBase

      const parcela = new Record(parcelasCol)
      parcela.set('venda_id', venda.id)
      parcela.set('numero_parcela', i)
      parcela.set('valor_parcela', valorAtual)

      let vencimento = new Date()
      vencimento.setMonth(vencimento.getMonth() + i)
      parcela.set('data_vencimento', vencimento.toISOString())

      parcela.set('status_parcela', 'Pendente')
      parcela.set('dias_atraso', 0)

      $app.save(parcela)

      const boleto = new Record(boletosCol)
      boleto.set('parcela_id', parcela.id)
      boleto.set('numero_boleto', `BOL-${venda.id.substring(0, 5).toUpperCase()}-${i}`)
      boleto.set('valor_boleto', valorAtual)
      boleto.set('data_vencimento', vencimento.toISOString())
      boleto.set('status_boleto', 'Gerado')

      $app.save(boleto)
    }
  } catch (err) {
    console.log('Erro auto parcela e boleto:', err.message)
  }

  e.next()
}, 'vendas')
