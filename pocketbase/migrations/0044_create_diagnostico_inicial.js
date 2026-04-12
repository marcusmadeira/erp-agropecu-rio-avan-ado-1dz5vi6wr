migrate(
  (app) => {
    const collection = new Collection({
      name: 'diagnostico_inicial',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      viewRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      createRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      updateRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      deleteRule: "@request.auth.id != '' && @request.auth.nivel_acesso = 1",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
        },
        { name: 'tamanho_ha', type: 'number', required: true },
        { name: 'total_animais', type: 'number', required: true },
        { name: 'arrobas_produzidas', type: 'number', required: true },
        { name: 'custos', type: 'number', required: true },
        { name: 'receitas', type: 'number', required: true },
        { name: 'custo_arroba', type: 'number', required: false },
        { name: 'lotacao', type: 'number', required: false },
        { name: 'produtividade_ha', type: 'number', required: false },
        { name: 'margem_lucro', type: 'number', required: false },
        { name: 'roi', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('diagnostico_inicial')
    app.delete(collection)
  },
)
