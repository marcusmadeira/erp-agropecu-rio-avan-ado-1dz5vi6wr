migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('codigo_verificacao')) {
      users.fields.add(new TextField({ name: 'codigo_verificacao' }))
    }
    if (!users.fields.getByName('validade_codigo')) {
      users.fields.add(new DateField({ name: 'validade_codigo' }))
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (users.fields.getByName('codigo_verificacao')) {
      users.fields.removeByName('codigo_verificacao')
    }
    if (users.fields.getByName('validade_codigo')) {
      users.fields.removeByName('validade_codigo')
    }

    app.save(users)
  },
)
