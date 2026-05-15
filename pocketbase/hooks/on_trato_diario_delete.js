onRecordDelete((e) => {
  $app.runInTransaction((txApp) => {
    const loteId = e.record.get('lote_id')
    const formulacaoId = e.record.get('formulacao_id')
    const qty = Number(e.record.get('quantidade_kg_servida'))
    const custoTotal = Number(e.record.get('custo_total_trato'))

    try {
      const formulacao = txApp.findRecordById('formulacoes_racao', formulacaoId)
      const feedName = 'Ração - ' + formulacao.get('nome_formulacao')
      const feedInsumo = txApp.findFirstRecordByFilter('estoque_insumos', `produto = '${feedName}'`)
      feedInsumo.set('quantidade_atual', (Number(feedInsumo.get('quantidade_atual')) || 0) + qty)
      txApp.save(feedInsumo)
    } catch (_) {}

    if (loteId && custoTotal > 0) {
      try {
        const animais = txApp.findRecordsByFilter(
          'animais',
          `lote_atual_id = '${loteId}'`,
          '',
          1000,
          0,
        )
        if (animais.length > 0) {
          const custoPorAnimal = custoTotal / animais.length
          for (const anim of animais) {
            const custoAtual = Number(anim.get('custo_variavel_acumulado')) || 0
            anim.set('custo_variavel_acumulado', Math.max(0, custoAtual - custoPorAnimal))
            txApp.save(anim)
          }
        }
      } catch (_) {}
    }
  })
  e.next()
}, 'trato_diario_lotes')
