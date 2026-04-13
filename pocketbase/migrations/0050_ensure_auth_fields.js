migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    let changed = false

    if (!col.fields.getByName('verification_code')) {
      col.fields.add(new TextField({ name: 'verification_code' }))
      changed = true
    }

    if (!col.fields.getByName('reset_code')) {
      col.fields.add(new TextField({ name: 'reset_code' }))
      changed = true
    }

    if (!col.fields.getByName('reset_code_expires')) {
      col.fields.add(new DateField({ name: 'reset_code_expires' }))
      changed = true
    }

    if (!col.fields.getByName('login')) {
      col.fields.add(new TextField({ name: 'login' }))
      changed = true
    }

    if (changed) {
      app.save(col)
    }
  },
  (app) => {
    // Safe down migration (do nothing)
  },
)
