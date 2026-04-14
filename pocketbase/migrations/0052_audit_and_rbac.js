migrate(
  (app) => {
    // 1. Update `users` collection to add `role` and `status_usuario`
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['Admin', 'Operacional'],
          required: false,
        }),
      )
    }

    if (!users.fields.getByName('status_usuario')) {
      users.fields.add(
        new SelectField({
          name: 'status_usuario',
          values: ['Ativo', 'Inativo'],
          required: false,
        }),
      )
    }

    app.save(users)

    // Set default roles based on existing nivel_acesso
    try {
      app
        .db()
        .newQuery(
          `UPDATE users SET role = 'Admin', status_usuario = 'Ativo' WHERE nivel_acesso = 'Gerente' OR nivel_acesso = 'Financeiro'`,
        )
        .execute()
      app
        .db()
        .newQuery(
          `UPDATE users SET role = 'Operacional', status_usuario = 'Ativo' WHERE nivel_acesso = 'Operacional'`,
        )
        .execute()
    } catch (err) {
      console.log(err)
    }

    // 2. Expand `auditoria_movimentacoes` collection
    const audit = app.findCollectionByNameOrId('auditoria_movimentacoes')

    const tipoAcao = audit.fields.getByName('tipo_acao')
    if (tipoAcao) {
      tipoAcao.values = [
        'Criação',
        'Edição',
        'Exclusão',
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
      ]
    }

    if (!audit.fields.getByName('user_email'))
      audit.fields.add(new TextField({ name: 'user_email' }))
    if (!audit.fields.getByName('user_role')) audit.fields.add(new TextField({ name: 'user_role' }))
    if (!audit.fields.getByName('description'))
      audit.fields.add(new TextField({ name: 'description' }))
    if (!audit.fields.getByName('ip_address'))
      audit.fields.add(new TextField({ name: 'ip_address' }))
    if (!audit.fields.getByName('status'))
      audit.fields.add(
        new SelectField({ name: 'status', values: ['SUCCESS', 'FAILED'], required: false }),
      )

    app.save(audit)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.fields.getByName('role')) users.fields.removeByName('role')
    if (users.fields.getByName('status_usuario')) users.fields.removeByName('status_usuario')
    app.save(users)

    const audit = app.findCollectionByNameOrId('auditoria_movimentacoes')
    const tipoAcao = audit.fields.getByName('tipo_acao')
    if (tipoAcao) {
      tipoAcao.values = ['Criação', 'Edição', 'Exclusão']
    }

    if (audit.fields.getByName('user_email')) audit.fields.removeByName('user_email')
    if (audit.fields.getByName('user_role')) audit.fields.removeByName('user_role')
    if (audit.fields.getByName('description')) audit.fields.removeByName('description')
    if (audit.fields.getByName('ip_address')) audit.fields.removeByName('ip_address')
    if (audit.fields.getByName('status')) audit.fields.removeByName('status')

    app.save(audit)
  },
)
