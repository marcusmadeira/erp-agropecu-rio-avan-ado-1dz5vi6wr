migrate(
  (app) => {
    const animais = app.findCollectionByNameOrId('animais')
    if (!animais.fields.getByName('piquete_atual_id')) {
      animais.fields.add(
        new RelationField({
          name: 'piquete_atual_id',
          collectionId: app.findCollectionByNameOrId('pastos_e_piquetes').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(animais)

    const lotes = app.findCollectionByNameOrId('lotes')
    if (!lotes.fields.getByName('finalidade_principal')) {
      lotes.fields.add(
        new SelectField({
          name: 'finalidade_principal',
          maxSelect: 1,
          values: [
            'vacas',
            'bezerros',
            'desmama',
            'recria',
            'novilhas',
            'touros',
            'engorda',
            'comercial',
            'PO',
          ],
        }),
      )
    }
    app.save(lotes)

    const apartacao = app.findCollectionByNameOrId('apartacao_dinamica')
    if (!apartacao.fields.getByName('pasto_anterior_id')) {
      apartacao.fields.add(
        new RelationField({
          name: 'pasto_anterior_id',
          collectionId: app.findCollectionByNameOrId('pastos_e_piquetes').id,
          maxSelect: 1,
        }),
      )
    }
    if (!apartacao.fields.getByName('pasto_novo_id')) {
      apartacao.fields.add(
        new RelationField({
          name: 'pasto_novo_id',
          collectionId: app.findCollectionByNameOrId('pastos_e_piquetes').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(apartacao)
  },
  (app) => {
    const animais = app.findCollectionByNameOrId('animais')
    animais.fields.removeByName('piquete_atual_id')
    app.save(animais)

    const lotes = app.findCollectionByNameOrId('lotes')
    lotes.fields.removeByName('finalidade_principal')
    app.save(lotes)

    const apartacao = app.findCollectionByNameOrId('apartacao_dinamica')
    apartacao.fields.removeByName('pasto_anterior_id')
    apartacao.fields.removeByName('pasto_novo_id')
    app.save(apartacao)
  },
)
