migrate(
  (app) => {
    const collection = new Collection({
      name: 'historico_importacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'arquivo_nome', type: 'text', required: true },
        { name: 'quantidade', type: 'number', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Sucesso', 'Parcial', 'Falha'],
          maxSelect: 1,
        },
        { name: 'registros_ids', type: 'json', required: false, maxSize: 2000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('historico_importacoes')
    app.delete(collection)
  },
)
