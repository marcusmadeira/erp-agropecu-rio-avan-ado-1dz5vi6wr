migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    let record

    try {
      record = app.findAuthRecordByEmail('users', 'admin@toriba.com')
    } catch (_) {
      record = new Record(users)
      record.setEmail('admin@toriba.com')
    }

    record.setPassword('admin123')
    record.setVerified(true)
    record.set('status_usuario', 'Ativo')
    record.set('role', 'Admin')
    record.set('nivel_acesso', 'Gerente')
    record.set('name', 'Admin Toriba')

    app.save(record)
  },
  (app) => {
    // Revert is not strictly necessary for this seed migration
  },
)
