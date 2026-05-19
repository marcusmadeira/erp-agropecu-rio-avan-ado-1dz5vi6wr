migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, role, nivel_acesso) => {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        record.setPassword('Toriba123@')
        record.set('nivel_acesso', nivel_acesso)
        record.set('role', role)
        record.set('name', name)
        record.setVerified(true)
        app.save(record)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Toriba123@')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        record.set('nivel_acesso', nivel_acesso)
        app.save(record)
      }
    }

    seedUser('admin@toriba.com', 'Administração', 'Admin', '')
    seedUser('gerente@toriba.com', 'Gerente', '', 'Gerente')
    seedUser('financeiro@toriba.com', 'Financeiro', '', 'Financeiro')
    seedUser('operacional@toriba.com', 'Operacional', 'Operacional', 'Operacional')
  },
  (app) => {
    // down migration intentionally empty to preserve user seeds
  },
)
