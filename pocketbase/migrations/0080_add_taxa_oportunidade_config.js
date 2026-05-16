migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_sistema')
    if (!col.fields.getByName('taxa_oportunidade_padrao')) {
      col.fields.add(new NumberField({ name: 'taxa_oportunidade_padrao', min: 0 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_sistema')
    col.fields.removeByName('taxa_oportunidade_padrao')
    app.save(col)
  },
)
