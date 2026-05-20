migrate(
  (app) => {
    const users = [
      {
        email: 'gerente@toriba.com.br',
        role: 'Admin',
        nivel_acesso: 'Gerente',
        name: 'Gerente Toriba',
      },
      {
        email: 'financeiro@toriba.com.br',
        role: 'Operacional',
        nivel_acesso: 'Financeiro',
        name: 'Financeiro Toriba',
      },
      {
        email: 'administrativo@toriba.com.br',
        role: 'Admin',
        nivel_acesso: 'Gerente',
        name: 'Administrativo Toriba',
      },
      {
        email: 'operacional@toriba.com.br',
        role: 'Operacional',
        nivel_acesso: 'Operacional',
        name: 'Operacional Toriba',
      },
    ]

    const col = app.findCollectionByNameOrId('users')

    for (const u of users) {
      try {
        const record = app.findAuthRecordByEmail('users', u.email)
        record.setPassword('Toriba123@')
        record.set('role', u.role)
        record.set('nivel_acesso', u.nivel_acesso)
        record.set('status_usuario', 'Ativo')
        record.set('name', u.name)
        record.setVerified(true)
        app.saveNoValidate(record)
      } catch (_) {
        const record = new Record(col)
        record.setEmail(u.email)
        record.setPassword('Toriba123@')
        record.setVerified(true)
        record.set('role', u.role)
        record.set('nivel_acesso', u.nivel_acesso)
        record.set('status_usuario', 'Ativo')
        record.set('name', u.name)
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {},
)
