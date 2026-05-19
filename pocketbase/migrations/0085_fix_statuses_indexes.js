migrate(
  (app) => {
    // Update mismatched statuses in animais
    app.db().newQuery("UPDATE animais SET status = 'Ativo' WHERE status = 'ATIVO'").execute()
    app
      .db()
      .newQuery("UPDATE vendas SET status_venda = 'Confirmada' WHERE status_venda = 'CONFIRMADA'")
      .execute()

    const animaisCol = app.findCollectionByNameOrId('animais')
    animaisCol.addIndex('idx_animais_status', false, 'status', '')
    app.save(animaisCol)

    const vendasCol = app.findCollectionByNameOrId('vendas')
    vendasCol.addIndex('idx_vendas_status', false, 'status_venda', '')
    vendasCol.addIndex('idx_vendas_data', false, 'data_venda', '')
    app.save(vendasCol)

    const parcelasCol = app.findCollectionByNameOrId('parcelas_venda')
    parcelasCol.addIndex('idx_parcelas_status', false, 'status_parcela', '')
    app.save(parcelasCol)
  },
  (app) => {
    const animaisCol = app.findCollectionByNameOrId('animais')
    animaisCol.removeIndex('idx_animais_status')
    app.save(animaisCol)

    const vendasCol = app.findCollectionByNameOrId('vendas')
    vendasCol.removeIndex('idx_vendas_status')
    vendasCol.removeIndex('idx_vendas_data')
    app.save(vendasCol)

    const parcelasCol = app.findCollectionByNameOrId('parcelas_venda')
    parcelasCol.removeIndex('idx_parcelas_status')
    app.save(parcelasCol)
  },
)
