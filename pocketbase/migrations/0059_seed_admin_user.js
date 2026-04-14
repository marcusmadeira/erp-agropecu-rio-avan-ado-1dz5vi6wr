migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'admin@toriba.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('admin@toriba.com')
    record.setPassword('admin123')
    record.setVerified(true)
    record.set('name', 'Administrador Toriba')
    record.set('role', 'Admin')
    record.set('status_usuario', 'Ativo')
    record.set('nivel_acesso', 'Gerente')
    record.set('login', 'admin')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'admin@toriba.com')
      app.delete(record)
    } catch (_) {}
  },
)
