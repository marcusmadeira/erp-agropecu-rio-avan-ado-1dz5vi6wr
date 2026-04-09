migrate(
  (app) => {
    const collection = new Collection({
      name: 'custos_evento',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      fields: [
        {
          name: 'evento_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('eventos_venda').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'descricao_custo', type: 'text', required: true },
        { name: 'valor_custo', type: 'number', required: true },
        { name: 'data_custo', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('custos_evento')
    app.delete(collection)
  },
)
