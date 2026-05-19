migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const defaultUsers = [
      { email: 'admin@toriba.com', role: 'Admin', nivel_acesso: 'Gerente', name: 'Administração' },
      { email: 'gerente@toriba.com', role: 'Admin', nivel_acesso: 'Gerente', name: 'Gerente' },
      {
        email: 'financeiro@toriba.com',
        role: 'Admin',
        nivel_acesso: 'Financeiro',
        name: 'Financeiro',
      },
      {
        email: 'operacional@toriba.com',
        role: 'Operacional',
        nivel_acesso: 'Operacional',
        name: 'Operacional',
      },
    ]

    for (const u of defaultUsers) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', u.email)
        record.setPassword('Toriba123@')
        record.set('role', u.role)
        record.set('nivel_acesso', u.nivel_acesso)
        record.setVerified(true)
        app.saveNoValidate(record)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(u.email)
        record.setPassword('Toriba123@')
        record.setVerified(true)
        record.set('name', u.name)
        record.set('role', u.role)
        record.set('nivel_acesso', u.nivel_acesso)
        app.saveNoValidate(record)
      }
    }

    const allRecords = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 1000, 0)
    for (const record of allRecords) {
      if (!defaultUsers.some((u) => u.email === record.getString('email'))) {
        record.setPassword('Toriba123@')
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {},
)
