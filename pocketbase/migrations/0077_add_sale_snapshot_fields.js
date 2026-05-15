migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('itens_venda')

    col.fields.add(
      new RelationField({
        name: 'lote_id_origem',
        collectionId: app.findCollectionByNameOrId('lotes').id,
        maxSelect: 1,
      }),
    )
    col.fields.add(
      new RelationField({
        name: 'pastagem_id_origem',
        collectionId: app.findCollectionByNameOrId('pastos_e_piquetes').id,
        maxSelect: 1,
      }),
    )
    col.fields.add(
      new NumberField({
        name: 'peso_momento_venda',
      }),
    )
    col.fields.add(
      new TextField({
        name: 'status_anterior',
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('itens_venda')
    col.fields.removeByName('lote_id_origem')
    col.fields.removeByName('pastagem_id_origem')
    col.fields.removeByName('peso_momento_venda')
    col.fields.removeByName('status_anterior')
    app.save(col)
  },
)
