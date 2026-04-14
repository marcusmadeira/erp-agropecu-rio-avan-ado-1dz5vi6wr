migrate(
  (app) => {
    const collection = new Collection({
      name: 'racao_formulada',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.nivel_acesso = 'Gerente' || @request.auth.role = 'Admin' || @request.auth.nivel_acesso = 'Financeiro'",
      updateRule:
        "@request.auth.nivel_acesso = 'Gerente' || @request.auth.role = 'Admin' || @request.auth.nivel_acesso = 'Financeiro'",
      deleteRule:
        "@request.auth.nivel_acesso = 'Gerente' || @request.auth.role = 'Admin' || @request.auth.nivel_acesso = 'Financeiro'",
      fields: [
        {
          name: 'receita_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('formulacoes_racao').id,
          maxSelect: 1,
        },
        { name: 'quantidade_kg', type: 'number', required: true },
        { name: 'custo_ingredientes', type: 'number', required: false },
        { name: 'custo_despesas_rateado', type: 'number', required: false },
        { name: 'custo_total_kg', type: 'number', required: false },
        { name: 'data_producao', type: 'date', required: true },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('users').id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_racao_formulada_receita ON racao_formulada (receita_id)',
        'CREATE INDEX idx_racao_formulada_data ON racao_formulada (data_producao)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('racao_formulada')
    app.delete(collection)
  },
)
