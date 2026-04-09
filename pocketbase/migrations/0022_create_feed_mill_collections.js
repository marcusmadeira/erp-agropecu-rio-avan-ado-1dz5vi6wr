migrate(
  (app) => {
    const rulesAdminGerente =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)"
    const rulesAllAuth = "@request.auth.id != ''"
    const rulesOperacional =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)"

    const formulacoes = new Collection({
      name: 'formulacoes_racao',
      type: 'base',
      listRule: rulesAllAuth,
      viewRule: rulesAllAuth,
      createRule: rulesAdminGerente,
      updateRule: rulesAdminGerente,
      deleteRule: rulesAdminGerente,
      fields: [
        { name: 'nome_formulacao', type: 'text', required: true },
        { name: 'custo_kg_produzido', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(formulacoes)

    const itens = new Collection({
      name: 'itens_formulacao',
      type: 'base',
      listRule: rulesAllAuth,
      viewRule: rulesAllAuth,
      createRule: rulesAdminGerente,
      updateRule: rulesAdminGerente,
      deleteRule: rulesAdminGerente,
      fields: [
        {
          name: 'formulacao_id',
          type: 'relation',
          required: true,
          collectionId: formulacoes.id,
          maxSelect: 1,
        },
        {
          name: 'insumo_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('estoque_insumos').id,
          maxSelect: 1,
        },
        { name: 'quantidade_kg', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_form_formulacao ON itens_formulacao (formulacao_id)',
        'CREATE INDEX idx_itens_form_insumo ON itens_formulacao (insumo_id)',
      ],
    })
    app.save(itens)

    const producao = new Collection({
      name: 'producao_diaria_racao',
      type: 'base',
      listRule: rulesAllAuth,
      viewRule: rulesAllAuth,
      createRule: rulesOperacional,
      updateRule: rulesOperacional,
      deleteRule: rulesOperacional,
      fields: [
        { name: 'data', type: 'date', required: true },
        {
          name: 'formulacao_id',
          type: 'relation',
          required: true,
          collectionId: formulacoes.id,
          maxSelect: 1,
        },
        { name: 'quantidade_kg_produzida', type: 'number', required: true },
        { name: 'custo_total', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_producao_formulacao ON producao_diaria_racao (formulacao_id)'],
    })
    app.save(producao)

    const trato = new Collection({
      name: 'trato_diario_lotes',
      type: 'base',
      listRule: rulesAllAuth,
      viewRule: rulesAllAuth,
      createRule: rulesOperacional,
      updateRule: rulesOperacional,
      deleteRule: rulesOperacional,
      fields: [
        { name: 'data', type: 'date', required: true },
        {
          name: 'lote_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('lotes').id,
          maxSelect: 1,
        },
        {
          name: 'formulacao_id',
          type: 'relation',
          required: true,
          collectionId: formulacoes.id,
          maxSelect: 1,
        },
        { name: 'quantidade_kg_servida', type: 'number', required: true },
        { name: 'custo_total_trato', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_trato_lote ON trato_diario_lotes (lote_id)',
        'CREATE INDEX idx_trato_formulacao ON trato_diario_lotes (formulacao_id)',
      ],
    })
    app.save(trato)
  },
  (app) => {
    const collections = [
      'trato_diario_lotes',
      'producao_diaria_racao',
      'itens_formulacao',
      'formulacoes_racao',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
