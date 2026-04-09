migrate(
  (app) => {
    const lotesCol = app.findCollectionByNameOrId('lotes')

    const collection = new Collection({
      name: 'animais',
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
        { name: 'id_manejo_brinco', type: 'text', required: true },
        { name: 'rgd_rgn_abcz', type: 'text' },
        {
          name: 'categoria',
          type: 'select',
          values: ['Matriz PO', 'Touro PO', 'Bezerro', 'Novilha TIP', 'Garrote TIP'],
        },
        { name: 'status', type: 'text' },
        { name: 'lote_atual', type: 'relation', collectionId: lotesCol.id, maxSelect: 1 },
        { name: 'peso_atual_kg', type: 'number' },
        { name: 'genealogia_pai', type: 'text' },
        { name: 'genealogia_mae', type: 'text' },
        { name: 'custo_variavel_acumulado', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_animais_id_manejo_brinco ON animais (id_manejo_brinco)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('animais')
    app.delete(collection)
  },
)
