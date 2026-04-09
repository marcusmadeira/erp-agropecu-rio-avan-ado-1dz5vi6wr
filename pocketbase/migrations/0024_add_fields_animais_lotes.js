migrate(
  (app) => {
    const pastos = new Collection({
      name: 'pastos_e_piquetes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true, max: 100 },
        { name: 'capacidade', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(pastos)

    const animais = app.findCollectionByNameOrId('animais')
    animais.fields.add(new TextField({ name: 'nome', max: 100 }))
    animais.fields.add(new DateField({ name: 'data_nascimento' }))
    animais.fields.add(
      new RelationField({ name: 'pai_id', collectionId: animais.id, maxSelect: 1 }),
    )
    animais.fields.add(
      new RelationField({ name: 'mae_id', collectionId: animais.id, maxSelect: 1 }),
    )
    app
      .db()
      .newQuery(
        `DELETE FROM animais WHERE id NOT IN (SELECT MIN(id) FROM animais GROUP BY id_manejo_brinco) AND id_manejo_brinco IS NOT NULL`,
      )
      .execute()
    animais.addIndex('idx_animais_brinco_unique', true, 'id_manejo_brinco', '')
    app.save(animais)

    const lotes = app.findCollectionByNameOrId('lotes')
    lotes.fields.add(
      new RelationField({ name: 'piquete_id', collectionId: pastos.id, maxSelect: 1 }),
    )
    app
      .db()
      .newQuery(
        `DELETE FROM lotes WHERE id NOT IN (SELECT MIN(id) FROM lotes GROUP BY nome_lote) AND nome_lote IS NOT NULL`,
      )
      .execute()
    lotes.addIndex('idx_lotes_nome_unique', true, 'nome_lote', '')
    app.save(lotes)
  },
  (app) => {
    const lotes = app.findCollectionByNameOrId('lotes')
    lotes.removeIndex('idx_lotes_nome_unique')
    lotes.fields.removeByName('piquete_id')
    app.save(lotes)

    const animais = app.findCollectionByNameOrId('animais')
    animais.removeIndex('idx_animais_brinco_unique')
    animais.fields.removeByName('nome')
    animais.fields.removeByName('data_nascimento')
    animais.fields.removeByName('pai_id')
    animais.fields.removeByName('mae_id')
    app.save(animais)

    const pastos = app.findCollectionByNameOrId('pastos_e_piquetes')
    app.delete(pastos)
  },
)
