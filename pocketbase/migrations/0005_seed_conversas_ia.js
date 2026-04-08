migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')

      // Idempotent: skip if already seeded
      try {
        app.findFirstRecordByFilter(
          'conversas_ia',
          `usuario_id = '${user.id}' AND pergunta = 'Mensagem de boas-vindas'`,
        )
        return
      } catch (_) {}

      const collection = app.findCollectionByNameOrId('conversas_ia')
      const record = new Record(collection)
      record.set('usuario_id', user.id)
      record.set('pergunta', 'Mensagem de boas-vindas')
      record.set(
        'resposta',
        'Olá! Sou o seu Assistente IA especialista no ERP Gestão Pecuária 360º. Fui treinado com o nosso manual completo. Como posso ajudar você a otimizar a gestão da sua propriedade hoje?',
      )
      app.save(record)
    } catch (_) {
      // User not found, skip seed
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      const record = app.findFirstRecordByFilter(
        'conversas_ia',
        `usuario_id = '${user.id}' AND pergunta = 'Mensagem de boas-vindas'`,
      )
      app.delete(record)
    } catch (_) {}
  },
)
