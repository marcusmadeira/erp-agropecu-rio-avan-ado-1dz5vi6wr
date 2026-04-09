migrate(
  (app) => {
    // 1. parceiros_negocios
    let parceiros
    try {
      parceiros = app.findCollectionByNameOrId('parceiros_negocios')
    } catch (_) {
      parceiros = new Collection({
        name: 'parceiros_negocios',
        type: 'base',
      })
    }

    parceiros.listRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)"
    parceiros.viewRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2)"
    parceiros.createRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    parceiros.updateRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    parceiros.deleteRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"

    if (!parceiros.fields.getByName('nome_razao_social'))
      parceiros.fields.add(new TextField({ name: 'nome_razao_social', required: true }))
    if (!parceiros.fields.getByName('tipo_documento'))
      parceiros.fields.add(new SelectField({ name: 'tipo_documento', values: ['CPF', 'CNPJ'] }))
    if (!parceiros.fields.getByName('numero_documento'))
      parceiros.fields.add(new TextField({ name: 'numero_documento' }))
    if (!parceiros.fields.getByName('contato_whatsapp'))
      parceiros.fields.add(new TextField({ name: 'contato_whatsapp' }))
    if (!parceiros.fields.getByName('email'))
      parceiros.fields.add(new EmailField({ name: 'email' }))
    if (!parceiros.fields.getByName('categoria_parceiro'))
      parceiros.fields.add(
        new SelectField({
          name: 'categoria_parceiro',
          values: ['Fornecedor', 'Cliente', 'Funcionário', 'Transportadora'],
        }),
      )
    if (!parceiros.fields.getByName('status'))
      parceiros.fields.add(new TextField({ name: 'status' }))

    app.save(parceiros)
    parceiros.addIndex('idx_parceiros_numero_documento', false, 'numero_documento', '')
    app.save(parceiros)

    // 2. lotes
    let lotes
    try {
      lotes = app.findCollectionByNameOrId('lotes')
    } catch (_) {
      lotes = new Collection({
        name: 'lotes',
        type: 'base',
      })
    }

    lotes.listRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)"
    lotes.viewRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)"
    lotes.createRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    lotes.updateRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    lotes.deleteRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"

    if (!lotes.fields.getByName('nome_lote'))
      lotes.fields.add(new TextField({ name: 'nome_lote', required: true }))
    if (!lotes.fields.getByName('centro_custo'))
      lotes.fields.add(
        new SelectField({ name: 'centro_custo', values: ['CC01-Nelore PO', 'CC02-Comercial TIP'] }),
      )
    if (!lotes.fields.getByName('quantidade_cabecas'))
      lotes.fields.add(new NumberField({ name: 'quantidade_cabecas' }))
    if (!lotes.fields.getByName('peso_medio_lote'))
      lotes.fields.add(new NumberField({ name: 'peso_medio_lote' }))
    if (!lotes.fields.getByName('custo_acumulado_nutricao'))
      lotes.fields.add(new NumberField({ name: 'custo_acumulado_nutricao' }))

    app.save(lotes)
    lotes.addIndex('idx_lotes_nome_lote', false, 'nome_lote', '')
    app.save(lotes)

    // 3. animais
    let animais
    try {
      animais = app.findCollectionByNameOrId('animais')
    } catch (_) {
      animais = new Collection({
        name: 'animais',
        type: 'base',
      })
    }

    animais.listRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)"
    animais.viewRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 2 || @request.auth.nivel_acesso = 3)"
    animais.createRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    animais.updateRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"
    animais.deleteRule =
      "@request.auth.id != '' && (@request.auth.nivel_acesso = 1 || @request.auth.nivel_acesso = 3)"

    if (!animais.fields.getByName('id_manejo_brinco'))
      animais.fields.add(new TextField({ name: 'id_manejo_brinco', required: true }))
    if (!animais.fields.getByName('rgd_rgn_abcz'))
      animais.fields.add(new TextField({ name: 'rgd_rgn_abcz' }))
    if (!animais.fields.getByName('categoria'))
      animais.fields.add(
        new SelectField({
          name: 'categoria',
          values: ['Matriz PO', 'Touro PO', 'Bezerro', 'Novilha TIP', 'Garrote TIP'],
        }),
      )
    if (!animais.fields.getByName('status')) animais.fields.add(new TextField({ name: 'status' }))
    if (!animais.fields.getByName('lote_atual'))
      animais.fields.add(
        new RelationField({ name: 'lote_atual', collectionId: lotes.id, maxSelect: 1 }),
      )
    if (!animais.fields.getByName('peso_atual_kg'))
      animais.fields.add(new NumberField({ name: 'peso_atual_kg' }))
    if (!animais.fields.getByName('genealogia_pai'))
      animais.fields.add(new TextField({ name: 'genealogia_pai' }))
    if (!animais.fields.getByName('genealogia_mae'))
      animais.fields.add(new TextField({ name: 'genealogia_mae' }))
    if (!animais.fields.getByName('custo_variavel_acumulado'))
      animais.fields.add(new NumberField({ name: 'custo_variavel_acumulado' }))

    app.save(animais)
    animais.addIndex('idx_animais_id_manejo_brinco', false, 'id_manejo_brinco', '')
    app.save(animais)
  },
  (app) => {
    // Safe down migration is to leave it empty since we don't want to accidentally drop existing critical data if reverted.
  },
)
