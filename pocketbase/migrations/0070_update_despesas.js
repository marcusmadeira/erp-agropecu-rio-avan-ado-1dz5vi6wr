migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('despesas')

    if (!col.fields.getByName('valor_total')) {
      col.fields.add(new NumberField({ name: 'valor_total' }))
    }
    if (!col.fields.getByName('quantidade_parcelas')) {
      col.fields.add(new NumberField({ name: 'quantidade_parcelas' }))
    }
    if (!col.fields.getByName('valor_parcela')) {
      col.fields.add(new NumberField({ name: 'valor_parcela' }))
    }
    if (!col.fields.getByName('vencimentos_parcelas')) {
      col.fields.add(new JSONField({ name: 'vencimentos_parcelas' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('despesas')
    col.fields.removeByName('valor_total')
    col.fields.removeByName('quantidade_parcelas')
    col.fields.removeByName('valor_parcela')
    col.fields.removeByName('vencimentos_parcelas')
    app.save(col)
  },
)
