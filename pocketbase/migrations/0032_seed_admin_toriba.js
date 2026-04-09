migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@toriba.com.br')
      return // Already exists
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('admin@toriba.com.br')
    record.setPassword('Admin123!')
    record.setVerified(true)
    record.set('name', 'Admin Toriba')
    record.set('nivel_acesso', 1)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@toriba.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
