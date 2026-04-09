migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_cobranca')
    try {
      app.findFirstRecordByData('configuracoes_cobranca', 'taxa_juros_diaria', 0.005)
    } catch (_) {
      const record = new Record(col)
      record.set('taxa_juros_diaria', 0.005)
      record.set('percentual_multa', 0.02)
      record.set('dias_notificacao_antes', 5)
      record.set('dias_notificacao_atraso', 1)
      record.set('intervalo_notificacao_atraso', 7)
      record.set('ativar_juros_automaticos', true)
      record.set('ativar_multa_automatica', true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('configuracoes_cobranca', 'taxa_juros_diaria', 0.005)
      app.delete(record)
    } catch (_) {}
  },
)
