migrate(
  (app) => {
    const collection = new Collection({
      name: 'eventos_venda',
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
        { name: 'nome_evento', type: 'text', required: true },
        {
          name: 'tipo_evento',
          type: 'select',
          required: true,
          values: ['Leilão', 'Feira', 'Venda_Fazenda'],
          maxSelect: 1,
        },
        { name: 'data_evento', type: 'date', required: true },
        { name: 'local', type: 'text' },
        { name: 'responsavel_evento', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Planejado', 'Em_Andamento', 'Finalizado'],
          maxSelect: 1,
        },
        { name: 'custo_total_evento', type: 'number' },
        { name: 'receita_total_evento', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('eventos_venda')
    app.delete(collection)
  },
)
