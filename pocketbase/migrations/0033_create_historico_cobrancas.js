migrate(
  (app) => {
    const collection = new Collection({
      name: 'historico_cobrancas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: '@request.auth.nivel_acesso = 1',
      deleteRule: '@request.auth.nivel_acesso = 1',
      fields: [
        { name: 'data_cobranca', type: 'date', required: true },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('parceiros_negocios').id,
          maxSelect: 1,
        },
        {
          name: 'boleto_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('boletos').id,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('users').id,
          maxSelect: 1,
        },
        {
          name: 'tipo_cobranca',
          type: 'select',
          required: true,
          values: ['WhatsApp', 'Email', 'Pessoal', 'Automática'],
          maxSelect: 1,
        },
        {
          name: 'status_cobranca',
          type: 'select',
          required: true,
          values: ['Enviado', 'Entregue', 'Lido', 'Respondido', 'Sem_Resposta'],
          maxSelect: 1,
        },
        { name: 'mensagem_enviada', type: 'text', required: false },
        { name: 'resultado', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_historico_cliente ON historico_cobrancas (cliente_id)',
        'CREATE INDEX idx_historico_boleto ON historico_cobrancas (boleto_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('historico_cobrancas')
    app.delete(collection)
  },
)
