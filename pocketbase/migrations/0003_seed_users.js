migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const seedUser = (email, name, role) => {
      try {
        // If user exists, just update role and name
        const record = app.findAuthRecordByEmail('users', email)
        record.set('nivel_acesso', role)
        record.set('name', name)
        app.save(record)
      } catch (_) {
        // If user doesn't exist, create new
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', name)
        record.set('nivel_acesso', role)
        app.save(record)
      }
    }

    seedUser('marcusmadeira@yahoo.com.br', 'Admin', 1)
    seedUser('gerente@toriba.com', 'Gerente', 2)
    seedUser('operador@toriba.com', 'Operacional', 3)
  },
  (app) => {
    const emails = ['gerente@toriba.com', 'operador@toriba.com']
    emails.forEach((email) => {
      try {
        const record = app.findAuthRecordByEmail('users', email)
        app.delete(record)
      } catch (_) {}
    })
  },
)
