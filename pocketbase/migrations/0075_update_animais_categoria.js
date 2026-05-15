migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    col.fields.add(
      new SelectField({
        name: 'categoria',
        maxSelect: 1,
        values: [
          'Matriz PO',
          'Touro PO',
          'Bezerro',
          'Novilha TIP',
          'Garrote TIP',
          'Vaca Descarte TIP',
          'Matriz TIP',
        ],
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    col.fields.add(
      new SelectField({
        name: 'categoria',
        maxSelect: 1,
        values: [
          'Matriz PO',
          'Touro PO',
          'Bezerro',
          'Novilha TIP',
          'Garrote TIP',
          'Vaca Descarte TIP',
        ],
      }),
    )

    app.save(col)
  },
)
