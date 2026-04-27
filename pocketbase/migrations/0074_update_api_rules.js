migrate(
  (app) => {
    const collections = [
      'animais',
      'lotes',
      'vendas',
      'parceiros_negocios',
      'transacoes_financeiras',
    ]
    for (let i = 0; i < collections.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(collections[i])
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        col.createRule = "@request.auth.id != ''"
        col.updateRule = "@request.auth.id != ''"
        col.deleteRule = "@request.auth.id != ''"
        app.saveNoValidate(col)
      } catch (_) {}
    }

    // Make animal_id not required on itens_venda to support Lote-only items
    try {
      const itensVenda = app.findCollectionByNameOrId('itens_venda')
      const animalField = itensVenda.fields.getByName('animal_id')
      if (animalField) {
        animalField.required = false
        app.saveNoValidate(itensVenda)
      }
    } catch (_) {}
  },
  (app) => {},
)
