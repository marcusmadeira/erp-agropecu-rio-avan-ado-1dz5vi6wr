migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    if (!col.fields.getByName('sexo')) {
      col.fields.add(new SelectField({ name: 'sexo', values: ['Macho', 'Fêmea'], maxSelect: 1 }))
    }

    const catField = col.fields.getByName('categoria')
    if (catField && !catField.values.includes('Vaca Descarte TIP')) {
      catField.values.push('Vaca Descarte TIP')
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('animais')

    try {
      col.fields.removeByName('sexo')
    } catch (_) {}

    const catField = col.fields.getByName('categoria')
    if (catField && catField.values) {
      catField.values = catField.values.filter((v) => v !== 'Vaca Descarte TIP')
    }

    app.save(col)
  },
)
