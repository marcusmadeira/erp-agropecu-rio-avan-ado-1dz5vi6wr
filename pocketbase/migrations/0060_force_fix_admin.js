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
    record.set('role', 'Admin')
    record.set('nivel_acesso', 'Gerente')
    record.set('status_usuario', 'Ativo')
    record.set('name', 'Administrador Toriba')
    record.set('login', 'admin')
    record.set('username', 'admin')

    app.save(record)
  },
  (app) => {
    // Revert not needed for this forced fix
  },
)
