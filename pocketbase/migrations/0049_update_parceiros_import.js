migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('parceiros_negocios')

    if (!col.fields.getByName('data_importacao')) {
      col.fields.add(new DateField({ name: 'data_importacao', required: false }))
    }

    const catField = col.fields.getByName('categoria_parceiro')
    if (catField) {
      catField.values = [
        'Fornecedor',
        'Cliente',
        'Funcionário',
        'Transportadora',
        'Pessoa Física',
        'Pessoa Jurídica',
        'Ração',
        'Medicamento',
        'Serviço',
        'Outro',
      ]
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('parceiros_negocios')

    col.fields.removeByName('data_importacao')

    const catField = col.fields.getByName('categoria_parceiro')
    if (catField) {
      catField.values = [
        'Fornecedor',
        'Cliente',
        'Funcionário',
        'Transportadora',
        'Pessoa Física',
        'Pessoa Jurídica',
      ]
    }

    app.save(col)
  },
)
