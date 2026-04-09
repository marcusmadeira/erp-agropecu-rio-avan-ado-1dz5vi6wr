migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes_sistema',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      updateRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      deleteRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      fields: [
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('configuracoes_sistema')
    app.delete(collection)
  },
)
