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
        { name: 'data', type: 'date', required: true },
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
          name: 'tipo_cobranca',
          type: 'select',
          required: true,
          selectValues: ['WhatsApp', 'Email', 'Pessoal'],
        },
        { name: 'status', type: 'text', required: false },
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
