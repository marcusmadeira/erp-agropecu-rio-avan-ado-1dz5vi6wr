migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('parceiros_negocios')

    if (!collection.fields.getByName('rg')) {
      collection.fields.add(new TextField({ name: 'rg', required: false }))
    }
    if (!collection.fields.getByName('data_nascimento')) {
      collection.fields.add(new DateField({ name: 'data_nascimento', required: false }))
    }
    if (!collection.fields.getByName('endereco_envio')) {
      collection.fields.add(new TextField({ name: 'endereco_envio', required: false }))
    }
    if (!collection.fields.getByName('nota_serasa')) {
      collection.fields.add(new NumberField({ name: 'nota_serasa', required: false }))
    }
    if (!collection.fields.getByName('permitir_venda_prazo')) {
      collection.fields.add(new BoolField({ name: 'permitir_venda_prazo', required: false }))
    }

    try {
      collection.addIndex('idx_parceiros_nota_serasa', false, 'nota_serasa', '')
    } catch (e) {}

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('parceiros_negocios')

    collection.fields.removeByName('rg')
    collection.fields.removeByName('data_nascimento')
    collection.fields.removeByName('endereco_envio')
    collection.fields.removeByName('nota_serasa')
    collection.fields.removeByName('permitir_venda_prazo')

    try {
      collection.removeIndex('idx_parceiros_nota_serasa')
    } catch (e) {}

    app.save(collection)
  },
)
