migrate(
  (app) => {
    const collection = new Collection({
      name: 'estoque_insumos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      fields: [
        { name: 'produto', type: 'text', required: true },
        { name: 'quantidade_atual', type: 'number', required: true },
        { name: 'unidade_medida', type: 'text', required: true },
        { name: 'custo_medio_unitario', type: 'number' },
        { name: 'estoque_minimo_critico', type: 'number' },
        { name: 'consumo_medio_diario', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_estoque_insumos_produto ON estoque_insumos (produto)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('estoque_insumos')
    app.delete(collection)
  },
)
