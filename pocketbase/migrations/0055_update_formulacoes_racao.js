migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('formulacoes_racao')

    if (!col.fields.getByName('categoria_animal')) {
      col.fields.add(
        new SelectField({
          name: 'categoria_animal',
          values: [
            'Bezerro Desmama',
            'Recria Macho',
            'Recria Fêmea',
            'Touros para Vendas',
            'Matrizes',
            'Novilhas',
            'Outras',
          ],
        }),
      )
    }

    if (!col.fields.getByName('ingredientes')) {
      col.fields.add(
        new JSONField({
          name: 'ingredientes',
        }),
      )
    }

    if (!col.fields.getByName('usuario_id')) {
      const usersCol = app.findCollectionByNameOrId('users')
      col.fields.add(
        new RelationField({
          name: 'usuario_id',
          collectionId: usersCol.id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('formulacoes_racao')

    const fieldsToRemove = ['categoria_animal', 'ingredientes', 'usuario_id']
    fieldsToRemove.forEach((f) => {
      const field = col.fields.getByName(f)
      if (field) {
        col.fields.remove(field)
      }
    })

    app.save(col)
  },
)
