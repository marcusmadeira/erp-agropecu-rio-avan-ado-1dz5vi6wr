migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('estoque_insumos')
    if (!col.fields.getByName('categoria')) {
      col.fields.add(
        new SelectField({
          name: 'categoria',
          values: [
            'Minerais',
            'Aditivos',
            'Sal',
            'Grãos',
            'Farelos',
            'Bagaço de Cana',
            'Casquinha de Soja',
            'DDG',
            'Outros',
          ],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('estoque_insumos')
    col.fields.removeByName('categoria')
    app.save(col)
  },
)
