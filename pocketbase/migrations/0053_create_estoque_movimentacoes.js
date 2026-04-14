migrate(
  (app) => {
    const collection = new Collection({
      name: 'estoque_movimentacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 'Gerente' || @request.auth.nivel_acesso = '1')",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['ENTRADA_NOTA_FISCAL', 'ENTRADA_MANUAL', 'SAIDA_RACAO', 'PRODUCAO_RACAO'],
          maxSelect: 1,
        },
        {
          name: 'produto_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('estoque_insumos').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'valor_unitario', type: 'number', required: false },
        { name: 'valor_total', type: 'number', required: false },
        { name: 'fornecedor', type: 'text', required: false },
        { name: 'nota_fiscal', type: 'text', required: false },
        { name: 'data', type: 'date', required: true },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('users').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('estoque_movimentacoes')
    app.delete(collection)
  },
)
