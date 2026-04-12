migrate(
  (app) => {
    // users
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('login')) users.fields.add(new TextField({ name: 'login' }))
    if (!users.fields.getByName('verification_code'))
      users.fields.add(new TextField({ name: 'verification_code' }))
    if (!users.fields.getByName('reset_code'))
      users.fields.add(new TextField({ name: 'reset_code' }))
    if (!users.fields.getByName('reset_code_expires'))
      users.fields.add(new DateField({ name: 'reset_code_expires' }))
    app.save(users)

    // parceiros_negocios
    const parceiros = app.findCollectionByNameOrId('parceiros_negocios')
    if (!parceiros.fields.getByName('contato_whatsapp_cobranca'))
      parceiros.fields.add(new TextField({ name: 'contato_whatsapp_cobranca' }))
    if (!parceiros.fields.getByName('email_cobranca'))
      parceiros.fields.add(new EmailField({ name: 'email_cobranca' }))
    app.save(parceiros)

    // pastos_e_piquetes
    const pastos = app.findCollectionByNameOrId('pastos_e_piquetes')
    if (!pastos.fields.getByName('nome_piquete'))
      pastos.fields.add(new TextField({ name: 'nome_piquete' }))
    if (!pastos.fields.getByName('area_hectares'))
      pastos.fields.add(new NumberField({ name: 'area_hectares' }))
    if (!pastos.fields.getByName('status_ocupacao'))
      pastos.fields.add(new TextField({ name: 'status_ocupacao' }))
    app.save(pastos)

    // lotes
    const lotes = app.findCollectionByNameOrId('lotes')
    if (!lotes.fields.getByName('piquete_atual_id'))
      lotes.fields.add(
        new RelationField({ name: 'piquete_atual_id', collectionId: pastos.id, maxSelect: 1 }),
      )
    if (!lotes.fields.getByName('quantidade_cabecas'))
      lotes.fields.add(new NumberField({ name: 'quantidade_cabecas' }))
    if (!lotes.fields.getByName('peso_medio_lote'))
      lotes.fields.add(new NumberField({ name: 'peso_medio_lote' }))
    if (!lotes.fields.getByName('custo_accumulado_nutricao'))
      lotes.fields.add(new NumberField({ name: 'custo_accumulado_nutricao' }))
    app.save(lotes)

    // animais
    const animais = app.findCollectionByNameOrId('animais')
    if (!animais.fields.getByName('lote_atual_id'))
      animais.fields.add(
        new RelationField({ name: 'lote_atual_id', collectionId: lotes.id, maxSelect: 1 }),
      )
    if (!animais.fields.getByName('peso_atual_kg'))
      animais.fields.add(new NumberField({ name: 'peso_atual_kg' }))
    if (!animais.fields.getByName('custo_variavel_accumulado'))
      animais.fields.add(new NumberField({ name: 'custo_variavel_accumulado' }))
    app.save(animais)

    // pesagens_diarias
    const pesagens = app.findCollectionByNameOrId('pesagens_diarias')
    if (!pesagens.fields.getByName('gmd_calculado'))
      pesagens.fields.add(new NumberField({ name: 'gmd_calculado' }))
    app.save(pesagens)

    // transacoes_financeiras
    const transacoes = app.findCollectionByNameOrId('transacoes_financeiras')
    if (!transacoes.fields.getByName('macroconta_inttegra'))
      transacoes.fields.add(new TextField({ name: 'macroconta_inttegra' }))
    if (!transacoes.fields.getByName('produto_vendido'))
      transacoes.fields.add(new TextField({ name: 'produto_vendido' }))
    app.save(transacoes)

    // historico_importacoes
    const historico = app.findCollectionByNameOrId('historico_importacoes')
    if (!historico.fields.getByName('tipo_de_dado'))
      historico.fields.add(new TextField({ name: 'tipo_de_dado' }))
    if (!historico.fields.getByName('arquivo_upload'))
      historico.fields.add(
        new FileField({ name: 'arquivo_upload', maxSelect: 1, maxSize: 52428800 }),
      )
    app.save(historico)

    // estoque_semen
    const semen = app.findCollectionByNameOrId('estoque_semen')
    if (!semen.fields.getByName('touro_id'))
      semen.fields.add(
        new RelationField({ name: 'touro_id', collectionId: animais.id, maxSelect: 1 }),
      )
    app.save(semen)
  },
  (app) => {
    // Non-destructive down migration
  },
)
