migrate(
  (app) => {
    const lotes = app.findCollectionByNameOrId('lotes')
    if (!lotes.fields.getByName('formulacao_id')) {
      lotes.fields.add(
        new RelationField({
          name: 'formulacao_id',
          collectionId: app.findCollectionByNameOrId('formulacoes_racao').id,
          maxSelect: 1,
        }),
      )
    }
    if (!lotes.fields.getByName('quantidade_racao_diaria')) {
      lotes.fields.add(new NumberField({ name: 'quantidade_racao_diaria' }))
    }
    app.save(lotes)

    const mov = app.findCollectionByNameOrId('estoque_movimentacoes')
    const produtoField = mov.fields.getByName('produto_id')
    if (produtoField) {
      produtoField.required = false
    }
    if (!mov.fields.getByName('racao_id')) {
      mov.fields.add(
        new RelationField({
          name: 'racao_id',
          collectionId: app.findCollectionByNameOrId('formulacoes_racao').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(mov)

    const trato = app.findCollectionByNameOrId('trato_diario_lotes')
    if (!trato.fields.getByName('usuario_id')) {
      trato.fields.add(
        new RelationField({
          name: 'usuario_id',
          collectionId: app.findCollectionByNameOrId('users').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(trato)
  },
  (app) => {
    const lotes = app.findCollectionByNameOrId('lotes')
    lotes.fields.removeByName('formulacao_id')
    lotes.fields.removeByName('quantidade_racao_diaria')
    app.save(lotes)

    const mov = app.findCollectionByNameOrId('estoque_movimentacoes')
    const produtoField = mov.fields.getByName('produto_id')
    if (produtoField) {
      produtoField.required = true
    }
    mov.fields.removeByName('racao_id')
    app.save(mov)

    const trato = app.findCollectionByNameOrId('trato_diario_lotes')
    trato.fields.removeByName('usuario_id')
    app.save(trato)
  },
)
