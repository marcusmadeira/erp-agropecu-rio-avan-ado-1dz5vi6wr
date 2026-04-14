migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('estoque_semen')

    if (!col.fields.getByName('rgd')) {
      col.fields.add(new TextField({ name: 'rgd' }))
    }
    if (!col.fields.getByName('genealogia_pai')) {
      col.fields.add(new TextField({ name: 'genealogia_pai' }))
    }
    if (!col.fields.getByName('genealogia_mae')) {
      col.fields.add(new TextField({ name: 'genealogia_mae' }))
    }
    if (!col.fields.getByName('avaliacao_pmgz')) {
      col.fields.add(new TextField({ name: 'avaliacao_pmgz' }))
    }
    if (!col.fields.getByName('caneca_id')) {
      let canecasId = null
      try {
        canecasId = app.findCollectionByNameOrId('canecas_semen').id
      } catch (_) {}

      if (canecasId) {
        col.fields.add(
          new RelationField({
            name: 'caneca_id',
            collectionId: canecasId,
            maxSelect: 1,
          }),
        )
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('estoque_semen')
    col.fields.removeByName('rgd')
    col.fields.removeByName('genealogia_pai')
    col.fields.removeByName('genealogia_mae')
    col.fields.removeByName('avaliacao_pmgz')
    col.fields.removeByName('caneca_id')
    app.save(col)
  },
)
