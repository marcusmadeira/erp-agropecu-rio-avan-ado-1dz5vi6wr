migrate(
  (app) => {
    // rebanhos
    const rebanhos = new Collection({
      name: 'rebanhos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'centro_custo', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(rebanhos)

    // apartacao_dinamica
    const apartacao = new Collection({
      name: 'apartacao_dinamica',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'animal_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('animais').id,
          maxSelect: 1,
        },
        { name: 'data_apartacao', type: 'date' },
        {
          name: 'lote_anterior_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('lotes').id,
          maxSelect: 1,
        },
        {
          name: 'lote_novo_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('lotes').id,
          maxSelect: 1,
        },
        { name: 'motivo', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(apartacao)

    // inventario_pecuario_geral
    const inv = new Collection({
      name: 'inventario_pecuario_geral',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'data_inventario', type: 'date' },
        { name: 'rebanho_id', type: 'relation', collectionId: rebanhos.id, maxSelect: 1 },
        { name: 'total_cabecas', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(inv)

    // estoque_peso_fazenda
    const estoque = new Collection({
      name: 'estoque_peso_fazenda',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'data_calculo', type: 'date' },
        { name: 'total_cabecas', type: 'number' },
        { name: 'total_peso_kg', type: 'number' },
        { name: 'total_arrobas', type: 'number' },
        { name: 'valor_total_rebanho', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(estoque)

    // canecas_semen
    const canecas = new Collection({
      name: 'canecas_semen',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'numero_caneca', type: 'text' },
        { name: 'doses_atuais', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(canecas)

    // Updates to existing collections
    const animaisCol = app.findCollectionByNameOrId('animais')
    if (!animaisCol.fields.getByName('arrobas_atuais')) {
      animaisCol.fields.add(new NumberField({ name: 'arrobas_atuais' }))
    }
    if (!animaisCol.fields.getByName('rebanho_id')) {
      animaisCol.fields.add(
        new RelationField({ name: 'rebanho_id', collectionId: rebanhos.id, maxSelect: 1 }),
      )
    }
    app.save(animaisCol)

    const pesagensCol = app.findCollectionByNameOrId('pesagens_diarias')
    if (!pesagensCol.fields.getByName('arrobas')) {
      pesagensCol.fields.add(new NumberField({ name: 'arrobas' }))
    }
    app.save(pesagensCol)

    const iatfCol = app.findCollectionByNameOrId('manejo_iatf_curral')
    if (!iatfCol.fields.getByName('caneca_id')) {
      iatfCol.fields.add(
        new RelationField({ name: 'caneca_id', collectionId: canecas.id, maxSelect: 1 }),
      )
    }
    app.save(iatfCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('canecas_semen'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('estoque_peso_fazenda'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('inventario_pecuario_geral'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('apartacao_dinamica'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('rebanhos'))
    } catch (_) {}
  },
)
