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
      Object.keys(venda).forEach((k) => {
        if (k !== 'centro_custo') record.set(k, venda[k])
      })
      txApp.save(record)
      recordId = record.id

      try {
        const auditCol = txApp.findCollectionByNameOrId('auditoria_movimentacoes')
        const auditRec = new Record(auditCol)
        auditRec.set('usuario_id', e.auth.id)
        auditRec.set('tipo_acao', 'CREATE')
        auditRec.set('tabela_afetada', 'vendas')
        auditRec.set('registro_id', record.id)
        auditRec.set('status', 'SUCCESS')
        auditRec.set('description', 'Venda registrada via API')
        auditRec.set('user_email', e.auth.getString('email'))
        auditRec.set('user_role', e.auth.getString('role') || e.auth.getString('nivel_acesso'))
        txApp.save(auditRec)
      } catch (err) {
        console.log('Audit save error on venda:', err.message)
      }

      const itensCol = txApp.findCollectionByNameOrId('itens_venda')
      for (let item of itens) {
        const recItem = new Record(itensCol)
        Object.keys(item).forEach((k) => recItem.set(k, item[k]))
        recItem.set('venda_id', record.id)

        if (item.tipo_item === 'Animal' && item.animal_id) {
          const animal = txApp.findRecordById('animais', item.animal_id)
          recItem.set('lote_id_origem', animal.get('lote_atual_id'))
          recItem.set('pastagem_id_origem', animal.get('piquete_atual_id'))
          recItem.set('peso_momento_venda', animal.get('peso_atual_kg'))
          recItem.set('status_anterior', animal.get('status'))

          animal.set('status', 'Vendido')
          txApp.save(animal)
        } else if (item.tipo_item === 'Lote' && item.lote_id) {
          const lote = txApp.findRecordById('lotes', item.lote_id)
          recItem.set('lote_id_origem', lote.id)
          recItem.set('pastagem_id_origem', lote.get('piquete_atual_id'))

          const animaisNoLote = txApp.findRecordsByFilter(
            'animais',
            `lote_atual_id = '${item.lote_id}' && status != 'Vendido'`,
            '',
            0,
            0,
          )
          for (let i = 0; i < animaisNoLote.length; i++) {
            animaisNoLote[i].set('status', 'Vendido')
            txApp.save(animaisNoLote[i])
          }
          txApp.save(lote)
        }

        txApp.save(recItem)
      }

      const parcelasCol = txApp.findCollectionByNameOrId('parcelas_venda')
      const boletosCol = txApp.findCollectionByNameOrId('boletos')

      for (let i = 0; i < parcelas.length; i++) {
        const p = parcelas[i]
        const recPar = new Record(parcelasCol)
        recPar.set('venda_id', record.id)
        recPar.set('numero_parcela', p.numero !== undefined ? p.numero : i + 1)
        recPar.set('valor_parcela', p.valor)
        recPar.set('data_vencimento', p.data_vencimento)
        recPar.set('status_parcela', p.status_parcela || 'Pendente')
        txApp.save(recPar)

        const recBol = new Record(boletosCol)
        recBol.set('parcela_id', recPar.id)
        recBol.set('venda_id', record.id)
        recBol.set('numero_parcela', p.numero !== undefined ? p.numero : i + 1)
        recBol.set('numero_boleto', `BOL-${record.id.substring(0, 5).toUpperCase()}-${i + 1}`)
        recBol.set('valor_boleto', p.valor)
        recBol.set('data_vencimento', p.data_vencimento)
        recBol.set('data_vencimento_original', p.data_vencimento)
        recBol.set('status_boleto', p.status_parcela === 'Paga' ? 'Pago' : 'Pendente')
        txApp.save(recBol)

        if (p.status_parcela === 'Paga') {
          const recebimentosCol = txApp.findCollectionByNameOrId('recebimentos_vendas')
          const recRec = new Record(recebimentosCol)
          recRec.set('boleto_id', recBol.id)
          recRec.set('venda_id', record.id)
          recRec.set('data_recebimento', p.data_vencimento || venda.data_venda)
          recRec.set('valor_recebido', p.valor)
          recRec.set('forma_recebimento', 'Dinheiro')
          recRec.set('usuario_id', e.auth.id)
          txApp.save(recRec)
        }
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
        const cc = venda.centro_custo || (venda.tipo_gado === 'PO' ? 'CC01' : 'CC02')
        transacao.set('centro_custo', cc.substring(0, 4))
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
