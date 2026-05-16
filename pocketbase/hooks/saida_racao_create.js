routerAdd(
  'POST',
  '/backend/v1/saida-racao',
  (e) => {
    const body = e.requestInfo().body
    const lote_id = body.lote_id
    const formulacao_id = body.formulacao_id
    const quantidade_kg = Number(body.quantidade_kg)
    const data = body.data
    const observacoes = body.observacoes || ''

    if (!lote_id || !formulacao_id || !quantidade_kg || !data) {
      throw new BadRequestError('Campos obrigatórios ausentes.')
    }

    if (quantidade_kg <= 0) {
      throw new BadRequestError('Quantidade deve ser maior que zero.')
    }

    const authRecord = e.auth
    if (!authRecord) throw new UnauthorizedError('Não autorizado.')

    let tratoId = ''

    $app.runInTransaction((txApp) => {
      const formulacao = txApp.findRecordById('formulacoes_racao', formulacao_id)
      const custoKg = Number(formulacao.get('custo_kg_produzido')) || 0
      const custoTotal = custoKg * quantidade_kg

      const feedName = 'Ração - ' + formulacao.get('nome_formulacao')
      let feedInsumo
      try {
        feedInsumo = txApp.findFirstRecordByFilter('estoque_insumos', `produto = {:name}`, {
          name: feedName,
        })
      } catch (_) {
        throw new BadRequestError(
          `Estoque da ração não encontrado. Produza a ração '${formulacao.get('nome_formulacao')}' primeiro.`,
        )
      }

      const currentQty = Number(feedInsumo.get('quantidade_atual')) || 0
      if (currentQty < quantidade_kg) {
        throw new BadRequestError(
          `Estoque insuficiente da ração. Atual: ${currentQty.toLocaleString('pt-BR')} kg.`,
        )
      }

      feedInsumo.set('quantidade_atual', currentQty - quantidade_kg)
      txApp.save(feedInsumo)

      const trato = new Record(txApp.findCollectionByNameOrId('trato_diario_lotes'))
      trato.set('lote_id', lote_id)
      trato.set('formulacao_id', formulacao_id)
      trato.set('quantidade_kg_servida', quantidade_kg)
      trato.set('custo_total_trato', custoTotal)
      trato.set('data', data)
      trato.set('observacoes', observacoes)
      trato.set('usuario_id', authRecord.id)
      txApp.save(trato)
      tratoId = trato.id

      const mov = new Record(txApp.findCollectionByNameOrId('estoque_movimentacoes'))
      mov.set('tipo', 'SAIDA_RACAO')
      mov.set('produto_id', feedInsumo.id)
      mov.set('quantidade', quantidade_kg)
      mov.set('valor_unitario', custoKg)
      mov.set('valor_total', custoTotal)
      mov.set('data', data)
      mov.set('usuario_id', authRecord.id)
      txApp.save(mov)

      const audit = new Record(txApp.findCollectionByNameOrId('auditoria_movimentacoes'))
      audit.set('usuario_id', authRecord.id)
      audit.set('tipo_acao', 'CREATE')
      audit.set('tabela_afetada', 'trato_diario_lotes')
      audit.set('registro_id', tratoId)
      audit.set('description', `Saída de ração: ${quantidade_kg} kg servidos. Lote ID: ${lote_id}`)
      audit.set('status', 'SUCCESS')
      txApp.save(audit)
    })

    return e.json(200, { sucesso: true, trato_id: tratoId })
  },
  $apis.requireAuth(),
)
