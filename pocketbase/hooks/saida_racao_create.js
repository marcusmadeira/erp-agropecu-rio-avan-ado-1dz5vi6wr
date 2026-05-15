routerAdd(
  'POST',
  '/backend/v1/saida-racao',
  (e) => {
    const body = e.requestInfo().body
    const lote_id = body.lote_id
    const formulacao_id = body.formulacao_id
    const quantidade_kg = Number(body.quantidade_kg)
    const data = body.data

    if (!lote_id || !formulacao_id || !quantidade_kg || !data) {
      return e.badRequestError('Dados incompletos.')
    }

    let result = {}
    $app.runInTransaction((txApp) => {
      const formulacao = txApp.findRecordById('formulacoes_racao', formulacao_id)
      const feedName = 'Ração - ' + formulacao.get('nome_formulacao')

      let feedInsumo
      try {
        feedInsumo = txApp.findFirstRecordByFilter('estoque_insumos', `produto = '${feedName}'`)
      } catch (_) {
        throw new BadRequestError(`Ração não encontrada no estoque: ${feedName}`)
      }

      const currentQty = Number(feedInsumo.get('quantidade_atual')) || 0
      if (currentQty < quantidade_kg) {
        throw new BadRequestError(
          `Estoque insuficiente de ${feedName}. Requer ${quantidade_kg}kg, disponível ${currentQty}kg.`,
        )
      }

      feedInsumo.set('quantidade_atual', currentQty - quantidade_kg)
      txApp.save(feedInsumo)

      const custoUnitario =
        Number(feedInsumo.get('custo_medio_unitario')) ||
        Number(formulacao.get('custo_kg_produzido')) ||
        0
      const custoTotalTrato = custoUnitario * quantidade_kg

      const mov = new Record(txApp.findCollectionByNameOrId('estoque_movimentacoes'))
      mov.set('tipo', 'SAIDA_RACAO')
      mov.set('produto_id', feedInsumo.id)
      mov.set('quantidade', quantidade_kg)
      mov.set('valor_unitario', custoUnitario)
      mov.set('valor_total', custoTotalTrato)
      mov.set('data', data)
      mov.set('usuario_id', e.auth?.id || '')
      mov.set('racao_id', formulacao_id)
      txApp.save(mov)

      const trato = new Record(txApp.findCollectionByNameOrId('trato_diario_lotes'))
      trato.set('data', data)
      trato.set('lote_id', lote_id)
      trato.set('formulacao_id', formulacao_id)
      trato.set('quantidade_kg_servida', quantidade_kg)
      trato.set('custo_total_trato', custoTotalTrato)
      trato.set('usuario_id', e.auth?.id || '')
      txApp.save(trato)

      result = { success: true, trato_id: trato.id }
    })
    return e.json(200, result)
  },
  $apis.requireAuth(),
)
