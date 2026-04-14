migrate(
  (app) => {
    const eventosCol = app.findCollectionByNameOrId('eventos_venda')
    if (!eventosCol.fields.getByName('descricao')) {
      eventosCol.fields.add(new TextField({ name: 'descricao' }))
    }
    app.save(eventosCol)

    const lotesEvento = new Collection({
      name: 'lotes_evento',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'evento_id',
          type: 'relation',
          collectionId: eventosCol.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'lote_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('lotes').id,
          required: true,
          maxSelect: 1,
        },
        { name: 'quantidade_animais', type: 'number' },
        { name: 'descricao', type: 'text' },
        { name: 'status', type: 'select', values: ['Disponivel', 'Vendido', 'Cancelado'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(lotesEvento)

    const animaisEvento = new Collection({
      name: 'animais_evento',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'evento_id',
          type: 'relation',
          collectionId: eventosCol.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'animal_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('animais').id,
          required: true,
          maxSelect: 1,
        },
        { name: 'lote_evento_id', type: 'relation', collectionId: lotesEvento.id, maxSelect: 1 },
        { name: 'status', type: 'select', values: ['Disponivel', 'Vendido', 'Cancelado'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(animaisEvento)

    const parceirosCol = app.findCollectionByNameOrId('parceiros_negocios')
    if (!parceirosCol.fields.getByName('endereco'))
      parceirosCol.fields.add(new TextField({ name: 'endereco' }))
    if (!parceirosCol.fields.getByName('tipo_cliente'))
      parceirosCol.fields.add(
        new SelectField({ name: 'tipo_cliente', values: ['Pessoa_Fisica', 'Pessoa_Juridica'] }),
      )
    app.save(parceirosCol)

    const vendasCol = app.findCollectionByNameOrId('vendas')
    if (!vendasCol.fields.getByName('tipo_venda'))
      vendasCol.fields.add(new SelectField({ name: 'tipo_venda', values: ['Avulsa', 'Evento'] }))
    if (!vendasCol.fields.getByName('observacoes'))
      vendasCol.fields.add(new TextField({ name: 'observacoes' }))
    app.save(vendasCol)

    const itensVendaCol = app.findCollectionByNameOrId('itens_venda')
    if (!itensVendaCol.fields.getByName('tipo_item'))
      itensVendaCol.fields.add(new SelectField({ name: 'tipo_item', values: ['Lote', 'Animal'] }))
    if (!itensVendaCol.fields.getByName('lote_id'))
      itensVendaCol.fields.add(
        new RelationField({
          name: 'lote_id',
          collectionId: app.findCollectionByNameOrId('lotes').id,
          maxSelect: 1,
        }),
      )
    if (!itensVendaCol.fields.getByName('quantidade'))
      itensVendaCol.fields.add(new NumberField({ name: 'quantidade' }))
    if (!itensVendaCol.fields.getByName('valor_total'))
      itensVendaCol.fields.add(new NumberField({ name: 'valor_total' }))
    if (!itensVendaCol.fields.getByName('descricao'))
      itensVendaCol.fields.add(new TextField({ name: 'descricao' }))
    app.save(itensVendaCol)

    const boletosCol = app.findCollectionByNameOrId('boletos')
    if (!boletosCol.fields.getByName('venda_id'))
      boletosCol.fields.add(
        new RelationField({ name: 'venda_id', collectionId: vendasCol.id, maxSelect: 1 }),
      )
    if (!boletosCol.fields.getByName('numero_parcela'))
      boletosCol.fields.add(new NumberField({ name: 'numero_parcela' }))
    if (!boletosCol.fields.getByName('data_vencimento_original'))
      boletosCol.fields.add(new DateField({ name: 'data_vencimento_original' }))
    if (!boletosCol.fields.getByName('data_pagamento'))
      boletosCol.fields.add(new DateField({ name: 'data_pagamento' }))
    if (!boletosCol.fields.getByName('valor_pago'))
      boletosCol.fields.add(new NumberField({ name: 'valor_pago' }))
    if (!boletosCol.fields.getByName('observacoes'))
      boletosCol.fields.add(new TextField({ name: 'observacoes' }))

    const statusField = boletosCol.fields.getByName('status_boleto')
    if (statusField && !statusField.values.includes('Atrasado')) {
      statusField.values = [
        'Gerado',
        'Enviado',
        'Pago',
        'Vencido',
        'Cancelado',
        'Atrasado',
        'Pendente',
      ]
    }
    app.save(boletosCol)

    const recebimentos = new Collection({
      name: 'recebimentos_vendas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'boleto_id',
          type: 'relation',
          collectionId: boletosCol.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'venda_id', type: 'relation', collectionId: vendasCol.id, maxSelect: 1 },
        { name: 'data_recebimento', type: 'date', required: true },
        { name: 'valor_recebido', type: 'number', required: true },
        {
          name: 'forma_recebimento',
          type: 'select',
          values: ['Dinheiro', 'Transferencia', 'Cheque', 'Outro'],
          required: true,
        },
        { name: 'comprovante_url', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'observacoes', type: 'text' },
        {
          name: 'usuario_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('users').id,
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(recebimentos)
  },
  (app) => {},
)
