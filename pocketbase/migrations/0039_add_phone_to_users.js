migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new TextField({ name: 'phone' }))
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('phone')
    app.save(users)
  },
)
