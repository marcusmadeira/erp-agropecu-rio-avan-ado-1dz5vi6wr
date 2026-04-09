migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      const col = app.findCollectionByNameOrId('notificacoes')

      const alerts = [
        {
          tipo: 'Estoque Crítico',
          desc: 'Estoque de Ração Inicial abaixo do limite mínimo.',
          lido: false,
        },
        { tipo: 'Prenhez Confirmada', desc: 'Matriz 001 confirmada prenhe.', lido: true },
        { tipo: 'Pesagem Registrada', desc: 'Lote Nelore PO pesado com sucesso.', lido: false },
        { tipo: 'Transação Pendente', desc: 'Pagamento do fornecedor X pendente.', lido: false },
        { tipo: 'Erro Sistema', desc: 'Falha ao sincronizar com balança eletrônica.', lido: true },
      ]

      for (const a of alerts) {
        const record = new Record(col)
        record.set('usuario_id', user.id)
        record.set('tipo_alerta', a.tipo)
        record.set('descricao', a.desc)
        record.set('lido', a.lido)
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      app
        .db()
        .newQuery('DELETE FROM notificacoes WHERE usuario_id = {:id}')
        .bind({ id: user.id })
        .execute()
    } catch (_) {}
  },
)
