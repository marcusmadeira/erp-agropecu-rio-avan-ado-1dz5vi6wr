migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vendas')

    if (!col.fields.getByName('numero_parcelas')) {
      col.fields.add(
        new NumberField({
          name: 'numero_parcelas',
          required: false,
        }),
      )
    }
    app.save(col)

    // Atualiza os registros existentes para terem numero_parcelas pelo menos 1
    app
      .db()
      .newQuery(
        `UPDATE vendas SET numero_parcelas = 1 WHERE numero_parcelas IS NULL OR numero_parcelas = 0`,
      )
      .execute()

    // Semente padrão para configuracoes_cobranca caso não exista
    try {
      app.findFirstRecordByData('configuracoes_cobranca', 'ativar_juros_automaticos', true)
    } catch (_) {
      const configCol = app.findCollectionByNameOrId('configuracoes_cobranca')
      const count = app.countRecords('configuracoes_cobranca')
      if (count === 0) {
        const record = new Record(configCol)
        record.set('taxa_juros_diaria', 0.005)
        record.set('percentual_multa', 0.02)
        record.set('dias_notificacao_antes', 3)
        record.set('dias_notificacao_atraso', 1)
        record.set('intervalo_notificacao_atraso', 3)
        record.set('ativar_juros_automaticos', true)
        record.set('ativar_multa_automatica', true)
        app.save(record)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vendas')
    if (col.fields.getByName('numero_parcelas')) {
      col.fields.removeByName('numero_parcelas')
      app.save(col)
    }
  },
)
