migrate(
  (app) => {
    const insumos = app.findCollectionByNameOrId('estoque_insumos')
    insumos.fields.add(new NumberField({ name: 'estoque_ideal' }))
    insumos.fields.add(new NumberField({ name: 'prazo_reposicao_dias' }))
    app.save(insumos)

    const planejamento = new Collection({
      name: 'planejamento_compras',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'insumo_id',
          type: 'relation',
          required: true,
          collectionId: insumos.id,
          maxSelect: 1,
        },
        { name: 'quantidade_sugerida', type: 'number', required: true },
        { name: 'prioridade', type: 'select', values: ['Crítico', 'Atenção', 'Normal'] },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Sugerido', 'Em Cotação', 'Comprado', 'Recebido'],
        },
        { name: 'valor_estimado', type: 'number' },
        { name: 'observacoes', type: 'text' },
        { name: 'usuario_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_plan_compras_insumo ON planejamento_compras (insumo_id)',
        'CREATE INDEX idx_plan_compras_status ON planejamento_compras (status)',
      ],
    })
    app.save(planejamento)
  },
  (app) => {
    try {
      const planejamento = app.findCollectionByNameOrId('planejamento_compras')
      app.delete(planejamento)
    } catch (e) {}

    try {
      const insumos = app.findCollectionByNameOrId('estoque_insumos')
      insumos.fields.removeByName('estoque_ideal')
      insumos.fields.removeByName('prazo_reposicao_dias')
      app.save(insumos)
    } catch (e) {}
  },
)
