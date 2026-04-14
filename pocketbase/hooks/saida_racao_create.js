routerAdd(
  'POST',
  '/backend/v1/saida-racao',
  (e) => {
    const body = e.requestInfo().body
    const loteId = body.lote_id
    const formulacaoId = body.formulacao_id
    const quantidade = Number(body.quantidade_kg)
    const data = body.data

    if (!loteId || !formulacaoId || quantidade <= 0 || !data) {
      throw new BadRequestError('Dados inválidos para saída de ração.')
    }

    const auth = e.auth
    const usuarioId = auth?.id || ''

    let custoTotalTrato = 0

    $app.runInTransaction((txApp) => {
      const estoques = txApp.findRecordsByFilter(
        'racao_formulada',
        'receita_id = {:receitaId} && quantidade_kg > 0',
        'data_producao ASC',
        1000,
        0,
        { receitaId: formulacaoId },
      )

      let restante = quantidade

      for (let i = 0; i < estoques.length; i++) {
        if (restante <= 0) break
        const est = estoques[i]
        const disponivel = est.get('quantidade_kg')
        const custoKg = est.get('custo_total_kg') || 0

        const aDescontar = Math.min(disponivel, restante)

        est.set('quantidade_kg', disponivel - aDescontar)
        txApp.save(est)

        custoTotalTrato += aDescontar * custoKg
        restante -= aDescontar
      }

      if (restante > 0) {
        throw new BadRequestError(
          `Estoque insuficiente de ração formulada. Faltam ${restante.toFixed(2)} kg.`,
        )
      }

      const tratoCol = txApp.findCollectionByNameOrId('trato_diario_lotes')
      const trato = new Record(tratoCol)
      trato.set('data', data)
      trato.set('lote_id', loteId)
      trato.set('formulacao_id', formulacaoId)
      trato.set('quantidade_kg_servida', quantidade)
      trato.set('custo_total_trato', custoTotalTrato)
      trato.set('usuario_id', usuarioId)
      txApp.save(trato)

      const movCol = txApp.findCollectionByNameOrId('estoque_movimentacoes')
      const mov = new Record(movCol)
      mov.set('tipo', 'SAIDA_RACAO')
      mov.set('racao_id', formulacaoId)
      mov.set('quantidade', quantidade)
      mov.set('valor_total', custoTotalTrato)
      mov.set('valor_unitario', quantidade > 0 ? custoTotalTrato / quantidade : 0)
      mov.set('data', data)
      mov.set('usuario_id', usuarioId)
      txApp.save(mov)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
