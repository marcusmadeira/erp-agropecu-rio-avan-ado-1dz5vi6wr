migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('parceiros_negocios')

    if (!col.fields.getByName('origem_importacao')) {
      col.fields.add(
        new SelectField({
          name: 'origem_importacao',
          values: ['Excel', 'CSV', 'PDF'],
        }),
      )
    }

    const categoriaField = col.fields.getByName('categoria_parceiro')
    if (categoriaField) {
      categoriaField.values = [
        'Fornecedor',
        'Cliente',
        'Funcionário',
        'Transportadora',
        'Pessoa Física',
        'Pessoa Jurídica',
      ]
    }

    app.save(col)

    app
      .db()
      .newQuery(`
    DELETE FROM parceiros_negocios WHERE id NOT IN (
      SELECT MIN(id) FROM parceiros_negocios GROUP BY numero_documento
    ) AND numero_documento IS NOT NULL AND numero_documento != ''
  `)
      .execute()

    col.addIndex('idx_parceiros_doc_unique', true, 'numero_documento', "numero_documento != ''")

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('parceiros_negocios')
    col.removeIndex('idx_parceiros_doc_unique')
    col.fields.removeByName('origem_importacao')

    const categoriaField = col.fields.getByName('categoria_parceiro')
    if (categoriaField) {
      categoriaField.values = ['Fornecedor', 'Cliente', 'Funcionário', 'Transportadora']
    }

    app.save(col)
  },
)
