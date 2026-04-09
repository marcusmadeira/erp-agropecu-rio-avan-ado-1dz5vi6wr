migrate(
  (app) => {
    const collection = new Collection({
      name: 'parceiros_negocios',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)",
      createRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      updateRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)",
      fields: [
        { name: 'nome_razao_social', type: 'text', required: true },
        { name: 'tipo_documento', type: 'select', values: ['CPF', 'CNPJ'] },
        { name: 'numero_documento', type: 'text' },
        { name: 'contato_whatsapp', type: 'text' },
        { name: 'email', type: 'email' },
        {
          name: 'categoria_parceiro',
          type: 'select',
          values: ['Fornecedor', 'Cliente', 'Funcionário', 'Transportadora'],
        },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_parceiros_numero_documento ON parceiros_negocios (numero_documento)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('parceiros_negocios')
    app.delete(collection)
  },
)
