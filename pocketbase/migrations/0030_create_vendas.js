migrate(
  (app) => {
    const eventos_venda_id = app.findCollectionByNameOrId('eventos_venda').id
    const parceiros_negocios_id = app.findCollectionByNameOrId('parceiros_negocios').id
    const animais_id = app.findCollectionByNameOrId('animais').id

    const vendas = new Collection({
      name: 'vendas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      fields: [
        {
          name: 'evento_id',
          type: 'relation',
          required: false,
          collectionId: eventos_venda_id,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: parceiros_negocios_id,
          maxSelect: 1,
        },
        { name: 'data_venda', type: 'date', required: true },
        {
          name: 'tipo_gado',
          type: 'select',
          required: true,
          values: ['Comercial', 'PO'],
          maxSelect: 1,
        },
        { name: 'quantidade_animais', type: 'number', required: true },
        { name: 'valor_total_venda', type: 'number', required: true },
        {
          name: 'forma_pagamento',
          type: 'select',
          required: true,
          values: ['AVista', 'Parcelado'],
          maxSelect: 1,
        },
        {
          name: 'status_venda',
          type: 'select',
          required: true,
          values: ['Pendente', 'Confirmada', 'Entregue'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_vendas_evento ON vendas (evento_id)',
        'CREATE INDEX idx_vendas_cliente ON vendas (cliente_id)',
        'CREATE INDEX idx_vendas_data ON vendas (data_venda)',
      ],
    })
    app.save(vendas)

    const itensVenda = new Collection({
      name: 'itens_venda',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      fields: [
        {
          name: 'venda_id',
          type: 'relation',
          required: true,
          collectionId: vendas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'animal_id',
          type: 'relation',
          required: true,
          collectionId: animais_id,
          maxSelect: 1,
        },
        { name: 'valor_unitario', type: 'number', required: true },
        { name: 'desconto_aplicado', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_venda_venda ON itens_venda (venda_id)',
        'CREATE INDEX idx_itens_venda_animal ON itens_venda (animal_id)',
      ],
    })
    app.save(itensVenda)

    try {
      const parceiros = app.findRecordsByFilter(
        'parceiros_negocios',
        "categoria_parceiro = 'Cliente'",
        '',
        1,
        0,
      )
      const animais = app.findRecordsByFilter('animais', '', '', 2, 0)
      const eventos = app.findRecordsByFilter('eventos_venda', '', '', 1, 0)

      if (parceiros.length > 0 && animais.length >= 2) {
        const venda = new Record(vendas)
        venda.set('cliente_id', parceiros[0].id)
        if (eventos.length > 0) venda.set('evento_id', eventos[0].id)
        venda.set('data_venda', new Date().toISOString().replace('T', ' '))
        venda.set('tipo_gado', 'Comercial')
        venda.set('quantidade_animais', 2)
        venda.set('valor_total_venda', 5500)
        venda.set('forma_pagamento', 'AVista')
        venda.set('status_venda', 'Entregue')
        app.save(venda)

        const item1 = new Record(itensVenda)
        item1.set('venda_id', venda.id)
        item1.set('animal_id', animais[0].id)
        item1.set('valor_unitario', 2500)
        item1.set('desconto_aplicado', 0)
        app.save(item1)

        const item2 = new Record(itensVenda)
        item2.set('venda_id', venda.id)
        item2.set('animal_id', animais[1].id)
        item2.set('valor_unitario', 3000)
        item2.set('desconto_aplicado', 0)
        app.save(item2)
      }
    } catch (e) {
      console.log('Seed failed:', e)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('itens_venda'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('vendas'))
    } catch (_) {}
  },
)
