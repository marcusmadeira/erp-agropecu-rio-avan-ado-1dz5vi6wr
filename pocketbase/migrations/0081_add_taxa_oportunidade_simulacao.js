migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simulacoes_cenarios')
    if (!col.fields.getByName('taxa_oportunidade_utilizada')) {
      col.fields.add(new NumberField({ name: 'taxa_oportunidade_utilizada', min: 0 }))
    }
    if (!col.fields.getByName('valor_custo_oportunidade')) {
      col.fields.add(new NumberField({ name: 'valor_custo_oportunidade', min: 0 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('simulacoes_cenarios')
    col.fields.removeByName('taxa_oportunidade_utilizada')
    col.fields.removeByName('valor_custo_oportunidade')
    app.save(col)
  },
)
