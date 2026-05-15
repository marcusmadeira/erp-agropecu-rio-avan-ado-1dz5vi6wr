onRecordDelete((e) => {
  const racaoId = e.record.get('receita_id')
  const qty = Number(e.record.get('quantidade_kg'))

  $app.runInTransaction((txApp) => {
    try {
      const formulacao = txApp.findRecordById('formulacoes_racao', racaoId)
      const feedName = 'Ração - ' + formulacao.get('nome_formulacao')

      try {
        const feedInsumo = txApp.findFirstRecordByFilter(
          'estoque_insumos',
          `produto = '${feedName}'`,
        )
        feedInsumo.set(
          'quantidade_atual',
          Math.max(0, (Number(feedInsumo.get('quantidade_atual')) || 0) - qty),
        )
        txApp.save(feedInsumo)
      } catch (_) {}

      const ingredientes = formulacao.get('ingredientes') || []
      for (const item of ingredientes) {
        const insumo_id = item.id_produto
        const perc = Number(item.proporcao_percentual) || 0
        const requiredQty = (perc / 100) * qty
        try {
          const insumo = txApp.findRecordById('estoque_insumos', insumo_id)
          insumo.set(
            'quantidade_atual',
            (Number(insumo.get('quantidade_atual')) || 0) + requiredQty,
          )
          txApp.save(insumo)
        } catch (_) {}
      }
    } catch (_) {}
  })
  e.next()
}, 'racao_formulada')
