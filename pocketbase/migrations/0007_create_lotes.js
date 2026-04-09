migrate(
  (app) => {
    const collection = new Collection({
      name: 'lotes',
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
        { name: 'nome_lote', type: 'text', required: true },
        { name: 'centro_custo', type: 'select', values: ['CC01-Nelore PO', 'CC02-Comercial TIP'] },
        { name: 'quantidade_cabecas', type: 'number' },
        { name: 'peso_medio_lote', type: 'number' },
        { name: 'custo_acumulado_nutricao', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_lotes_nome_lote ON lotes (nome_lote)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('lotes')
    app.delete(collection)
  },
)
