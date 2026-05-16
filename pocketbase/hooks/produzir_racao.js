routerAdd(
  'POST',
  '/backend/v1/produzir-racao',
  (e) => {
    const body = e.requestInfo().body
    const receita_id = body.receita_id
    const quantidade_kg = Number(body.quantidade_kg)
    const data_producao = body.data_producao

    if (!receita_id || !quantidade_kg || !data_producao) {
      throw new BadRequestError('Campos obrigatórios ausentes.')
    }

    const authRecord = e.auth
    if (!authRecord) throw new UnauthorizedError('Não autorizado.')

    let result = {}

    $app.runInTransaction((txApp) => {
      const formulacao = txApp.findRecordById('formulacoes_racao', receita_id)
      const ingredientes = formulacao.get('ingredientes') || []

      let custoIngredientes = 0

      // Decrement inventory and calculate raw material costs
      for (const item of ingredientes) {
        const insumo_id = item.id_produto
        const perc = Number(item.proporcao_percentual) || 0
        const requiredQty = (perc / 100) * quantidade_kg

        const insumo = txApp.findRecordById('estoque_insumos', insumo_id)
        const currentQty = Number(insumo.get('quantidade_atual')) || 0
        if (currentQty < requiredQty) {
          throw new BadRequestError(`Estoque insuficiente para o insumo: ${insumo.get('produto')}`)
        }

        insumo.set('quantidade_atual', currentQty - requiredQty)
        txApp.save(insumo)

        const custoMedio = Number(insumo.get('custo_medio_unitario')) || 0
        const custoItem = custoMedio * requiredQty
        custoIngredientes += custoItem

        const movSaida = new Record(txApp.findCollectionByNameOrId('estoque_movimentacoes'))
        movSaida.set('tipo', 'SAIDA_RACAO')
        movSaida.set('produto_id', insumo_id)
        movSaida.set('quantidade', requiredQty)
        movSaida.set('valor_unitario', custoMedio)
        movSaida.set('valor_total', custoItem)
        movSaida.set('data', data_producao)
        movSaida.set('usuario_id', authRecord.id)
        txApp.save(movSaida)
      }

      const dateObj = new Date(data_producao)
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestError('Data de produção inválida.')
      }

      // Prorate monthly operational expenses
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const lastDayOfMonth = new Date(year, dateObj.getMonth() + 1, 0).getDate()

      const firstDay = `${year}-${month}-01 00:00:00.000Z`
      const lastDay = `${year}-${month}-${lastDayOfMonth} 23:59:59.999Z`

      const despesas = txApp.findRecordsByFilter(
        'despesas',
        `data_despesa >= '${firstDay}' && data_despesa <= '${lastDay}'`,
        '',
        10000,
        0,
      )
      let totalDespesas = 0
      for (const d of despesas) {
        totalDespesas += Number(d.get('valor')) || 0
      }

      const custoDespesasRateado = totalDespesas / 30 // simplistic daily rateio
      const custoFinalKg = (custoIngredientes + custoDespesasRateado) / quantidade_kg

      // Credit the finished product into stock
      let feedInsumo
      const feedName = 'Ração - ' + formulacao.get('nome_formulacao')
      try {
        feedInsumo = txApp.findFirstRecordByFilter('estoque_insumos', `produto = '${feedName}'`)
      } catch (_) {
        feedInsumo = new Record(txApp.findCollectionByNameOrId('estoque_insumos'))
        feedInsumo.set('produto', feedName)
        feedInsumo.set('quantidade_atual', 0)
        feedInsumo.set('unidade_medida', 'KG')
        feedInsumo.set('categoria', 'Outros')
        txApp.save(feedInsumo)
      }

      feedInsumo.set(
        'quantidade_atual',
        (Number(feedInsumo.get('quantidade_atual')) || 0) + quantidade_kg,
      )
      feedInsumo.set('custo_medio_unitario', custoFinalKg)
      txApp.save(feedInsumo)

      const movEntrada = new Record(txApp.findCollectionByNameOrId('estoque_movimentacoes'))
      movEntrada.set('tipo', 'PRODUCAO_RACAO')
      movEntrada.set('produto_id', feedInsumo.id)
      movEntrada.set('quantidade', quantidade_kg)
      movEntrada.set('valor_unitario', custoFinalKg)
      movEntrada.set('valor_total', custoFinalKg * quantidade_kg)
      movEntrada.set('data', data_producao)
      movEntrada.set('usuario_id', authRecord.id)
      txApp.save(movEntrada)

      // Save historical production record
      const racaoRecord = new Record(txApp.findCollectionByNameOrId('racao_formulada'))
      racaoRecord.set('receita_id', receita_id)
      racaoRecord.set('quantidade_kg', quantidade_kg)
      racaoRecord.set('custo_ingredientes', custoIngredientes)
      racaoRecord.set('custo_despesas_rateado', custoDespesasRateado)
      racaoRecord.set('custo_total_kg', custoFinalKg)
      racaoRecord.set('data_producao', data_producao)
      racaoRecord.set('usuario_id', authRecord.id)
      txApp.save(racaoRecord)

      const audit = new Record(txApp.findCollectionByNameOrId('auditoria_movimentacoes'))
      audit.set('usuario_id', authRecord.id)
      audit.set('tipo_acao', 'CREATE')
      audit.set('tabela_afetada', 'producao_racao')
      audit.set('registro_id', racaoRecord.id)
      audit.set(
        'description',
        `Produção de ${quantidade_kg} kg da receita ${formulacao.get('nome_formulacao')}`,
      )
      audit.set('status', 'SUCCESS')
      txApp.save(audit)

      result = {
        sucesso: true,
        racao_id: racaoRecord.id,
        custo_final_kg: custoFinalKg,
      }
    })

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
