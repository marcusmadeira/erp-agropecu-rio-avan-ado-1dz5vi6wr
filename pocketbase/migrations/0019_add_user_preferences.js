migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('email_notifications')) {
      users.fields.add(new BoolField({ name: 'email_notifications' }))
    }
    if (!users.fields.getByName('theme')) {
      users.fields.add(new SelectField({ name: 'theme', values: ['light', 'dark'], maxSelect: 1 }))
    }
    if (!users.fields.getByName('language')) {
      users.fields.add(new SelectField({ name: 'language', values: ['pt', 'en'], maxSelect: 1 }))
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('email_notifications')
    users.fields.removeByName('theme')
    users.fields.removeByName('language')
    app.save(users)
  },
)
