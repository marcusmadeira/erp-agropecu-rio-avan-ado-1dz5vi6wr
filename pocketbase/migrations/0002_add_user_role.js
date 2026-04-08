migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('nivel_acesso')) {
      col.fields.add(
        new NumberField({
          name: 'nivel_acesso',
          min: 1,
          max: 3,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    const field = col.fields.getByName('nivel_acesso')
    if (field) {
      col.fields.removeByName('nivel_acesso')
      app.save(col)
    }
  },
)
