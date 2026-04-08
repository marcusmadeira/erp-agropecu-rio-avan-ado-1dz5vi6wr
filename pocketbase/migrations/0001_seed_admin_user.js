migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('marcusmadeira@yahoo.com.br')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Marcus Madeira')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
