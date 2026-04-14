migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@toriba.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('admin@toriba.com')
    record.setPassword('admin123')
    record.setVerified(true)
    record.set('name', 'Admin Teste')
    record.set('role', 'Admin')
    record.set('status_usuario', 'Ativo')
    record.set('nivel_acesso', 'Gerente')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@toriba.com')
      app.delete(record)
    } catch (_) {}
  },
)
