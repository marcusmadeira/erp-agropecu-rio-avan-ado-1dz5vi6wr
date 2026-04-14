routerAdd(
  'POST',
  '/backend/v1/vendas/registrar',
  (e) => {
    const body = e.requestInfo().body
    const { venda, itens, parcelas } = body

    let recordId
    $app.runInTransaction((txApp) => {
      const vendasCol = txApp.findCollectionByNameOrId('vendas')
      const record = new Record(vendasCol)
      Object.keys(venda).forEach((k) => record.set(k, venda[k]))
      txApp.save(record)
      recordId = record.id

      const itensCol = txApp.findCollectionByNameOrId('itens_venda')
      for (let item of itens) {
        const recItem = new Record(itensCol)
        Object.keys(item).forEach((k) => recItem.set(k, item[k]))
        recItem.set('venda_id', record.id)
        txApp.save(recItem)

        if (item.tipo_item === 'Animal' && item.animal_id) {
          const animal = txApp.findRecordById('animais', item.animal_id)
          animal.set('status', 'Vendido')
          txApp.save(animal)
        } else if (item.tipo_item === 'Lote' && item.lote_id) {
          const lote = txApp.findRecordById('lotes', item.lote_id)
          txApp.save(lote)
        }
      }

      const parcelasCol = txApp.findCollectionByNameOrId('parcelas_venda')
      const boletosCol = txApp.findCollectionByNameOrId('boletos')

      for (let i = 0; i < parcelas.length; i++) {
        const p = parcelas[i]
        const recPar = new Record(parcelasCol)
        recPar.set('venda_id', record.id)
        recPar.set('numero_parcela', p.numero || i + 1)
        recPar.set('valor_parcela', p.valor)
        recPar.set('data_vencimento', p.data_vencimento)
        recPar.set('status_parcela', p.status_parcela || 'Pendente')
        txApp.save(recPar)

        const recBol = new Record(boletosCol)
        recBol.set('parcela_id', recPar.id)
        recBol.set('venda_id', record.id)
        recBol.set('numero_parcela', p.numero || i + 1)
        recBol.set('numero_boleto', `BOL-${record.id.substring(0, 5).toUpperCase()}-${i + 1}`)
        recBol.set('valor_boleto', p.valor)
        recBol.set('data_vencimento', p.data_vencimento)
        recBol.set('data_vencimento_original', p.data_vencimento)
        recBol.set('status_boleto', p.status_parcela === 'Paga' ? 'Pago' : 'Pendente')
        txApp.save(recBol)
      }

      if (venda.status_venda === 'Confirmada' || venda.status_venda === 'Entregue') {
        const transacoesCol = txApp.findCollectionByNameOrId('transacoes_financeiras')
        const transacao = new Record(transacoesCol)
        transacao.set('data_competencia', venda.data_venda || new Date().toISOString())
        transacao.set('data_vencimento', venda.data_venda || new Date().toISOString())
        transacao.set('descricao_lancamento', `Receita Venda ${record.id}`)
        transacao.set('parceiro_id', venda.cliente_id)
        transacao.set('tipo_movimento', 'Receita')
        transacao.set('classificacao_custo', 'VARIÁVEL')
        transacao.set(
          'centro_custo',
          venda.tipo_gado === 'PO' ? 'CC01-Nelore PO' : 'CC02-Comercial TIP',
        )
        transacao.set('valor_total', venda.valor_total_venda)
        transacao.set(
          'status_pagamento',
          venda.forma_pagamento === 'AVista' ? 'Recebido' : 'Pendente',
        )
        txApp.save(transacao)
      }
    })

    return e.json(200, { id: recordId })
  },
  $apis.requireAuth(),
)
