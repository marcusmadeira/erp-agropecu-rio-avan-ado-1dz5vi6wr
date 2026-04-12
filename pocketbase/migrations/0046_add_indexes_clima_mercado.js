migrate(
  (app) => {
    const chuvas = app.findCollectionByNameOrId('registro_chuvas')
    chuvas.addIndex('idx_chuvas_data', false, 'data_chuva', '')
    app.save(chuvas)

    const mercado = app.findCollectionByNameOrId('precos_mercado')
    mercado.addIndex('idx_mercado_data', false, 'data_registro', '')
    mercado.addIndex('idx_mercado_regiao', false, 'regiao', '')
    app.save(mercado)
  },
  (app) => {
    const chuvas = app.findCollectionByNameOrId('registro_chuvas')
    chuvas.removeIndex('idx_chuvas_data')
    app.save(chuvas)

    const mercado = app.findCollectionByNameOrId('precos_mercado')
    mercado.removeIndex('idx_mercado_data')
    mercado.removeIndex('idx_mercado_regiao')
    app.save(mercado)
  },
)
