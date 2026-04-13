migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    col.fields.add(
      new DateField({
        name: 'data_importacao',
        required: false,
      }),
    )

    col.fields.add(
      new SelectField({
        name: 'origem_importacao',
        values: ['Excel', 'CSV', 'PDF'],
        maxSelect: 1,
        required: false,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('animais')
    col.fields.removeByName('data_importacao')
    col.fields.removeByName('origem_importacao')
    app.save(col)
  },
)
