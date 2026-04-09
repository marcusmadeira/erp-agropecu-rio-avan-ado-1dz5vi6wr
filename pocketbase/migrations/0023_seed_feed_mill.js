migrate(
  (app) => {
    const getOrCreateInsumo = (nome) => {
      try {
        return app.findFirstRecordByData('estoque_insumos', 'produto', nome)
      } catch (_) {
        const col = app.findCollectionByNameOrId('estoque_insumos')
        const record = new Record(col)
        record.set('produto', nome)
        record.set('quantidade_atual', 10000)
        record.set('unidade_medida', 'Kg')
        record.set('custo_medio_unitario', 1.5)
        app.save(record)
        return record
      }
    }

    const getOrCreateLote = (nome) => {
      try {
        return app.findFirstRecordByData('lotes', 'nome_lote', nome)
      } catch (_) {
        const col = app.findCollectionByNameOrId('lotes')
        const record = new Record(col)
        record.set('nome_lote', nome)
        record.set('centro_custo', 'CC01-Nelore PO')
        record.set('quantidade_cabecas', 50)
        record.set('peso_medio_lote', 300)
        record.set('custo_acumulado_nutricao', 0)
        app.save(record)
        return record
      }
    }

    const insumoMilho = getOrCreateInsumo('Milho Moído')
    const insumoSoja = getOrCreateInsumo('Farelo de Soja')
    const lote = getOrCreateLote('Lote Engorda 01')

    // Formulacao 1
    let form1
    try {
      form1 = app.findFirstRecordByData('formulacoes_racao', 'nome_formulacao', 'Ração Engorda 18%')
    } catch (_) {
      const col = app.findCollectionByNameOrId('formulacoes_racao')
      form1 = new Record(col)
      form1.set('nome_formulacao', 'Ração Engorda 18%')
      form1.set('custo_kg_produzido', 1.65)
      app.save(form1)

      // Itens Form 1
      const itensCol = app.findCollectionByNameOrId('itens_formulacao')

      const item1 = new Record(itensCol)
      item1.set('formulacao_id', form1.id)
      item1.set('insumo_id', insumoMilho.id)
      item1.set('quantidade_kg', 70)
      app.save(item1)

      const item2 = new Record(itensCol)
      item2.set('formulacao_id', form1.id)
      item2.set('insumo_id', insumoSoja.id)
      item2.set('quantidade_kg', 30)
      app.save(item2)
    }

    // Formulacao 2
    let form2
    try {
      form2 = app.findFirstRecordByData(
        'formulacoes_racao',
        'nome_formulacao',
        'Ração Manutenção 14%',
      )
    } catch (_) {
      const col = app.findCollectionByNameOrId('formulacoes_racao')
      form2 = new Record(col)
      form2.set('nome_formulacao', 'Ração Manutenção 14%')
      form2.set('custo_kg_produzido', 1.45)
      app.save(form2)

      // Itens Form 2
      const itensCol = app.findCollectionByNameOrId('itens_formulacao')

      const item1 = new Record(itensCol)
      item1.set('formulacao_id', form2.id)
      item1.set('insumo_id', insumoMilho.id)
      item1.set('quantidade_kg', 80)
      app.save(item1)

      const item2 = new Record(itensCol)
      item2.set('formulacao_id', form2.id)
      item2.set('insumo_id', insumoSoja.id)
      item2.set('quantidade_kg', 20)
      app.save(item2)
    }

    // Producao
    try {
      app.findFirstRecordByData('producao_diaria_racao', 'formulacao_id', form1.id)
    } catch (_) {
      const col = app.findCollectionByNameOrId('producao_diaria_racao')
      const record = new Record(col)
      record.set('data', new Date().toISOString())
      record.set('formulacao_id', form1.id)
      record.set('quantidade_kg_produzida', 2000)
      record.set('custo_total', 3300)
      app.save(record)
    }

    // Trato
    try {
      app.findFirstRecordByData('trato_diario_lotes', 'lote_id', lote.id)
    } catch (_) {
      const col = app.findCollectionByNameOrId('trato_diario_lotes')
      const record = new Record(col)
      record.set('data', new Date().toISOString())
      record.set('lote_id', lote.id)
      record.set('formulacao_id', form1.id)
      record.set('quantidade_kg_servida', 500)
      record.set('custo_total_trato', 825)
      app.save(record)
    }
  },
  (app) => {
    const deleteByField = (colName, field, value) => {
      try {
        const records = app.findRecordsByFilter(colName, `${field} = '${value}'`, '', 100, 0)
        for (const r of records) app.delete(r)
      } catch (_) {}
    }

    try {
      const f1 = app.findFirstRecordByData(
        'formulacoes_racao',
        'nome_formulacao',
        'Ração Engorda 18%',
      )
      deleteByField('itens_formulacao', 'formulacao_id', f1.id)
      deleteByField('producao_diaria_racao', 'formulacao_id', f1.id)
      deleteByField('trato_diario_lotes', 'formulacao_id', f1.id)
      app.delete(f1)
    } catch (_) {}

    try {
      const f2 = app.findFirstRecordByData(
        'formulacoes_racao',
        'nome_formulacao',
        'Ração Manutenção 14%',
      )
      deleteByField('itens_formulacao', 'formulacao_id', f2.id)
      app.delete(f2)
    } catch (_) {}
  },
)
