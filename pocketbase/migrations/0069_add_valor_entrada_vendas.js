migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vendas')
    col.fields.add(new NumberField({ name: 'valor_entrada' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vendas')
    col.fields.removeByName('valor_entrada')
    app.save(col)
  },
)
