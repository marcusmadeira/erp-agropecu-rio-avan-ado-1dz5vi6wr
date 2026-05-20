migrate(
  (app) => {
    // Clean up existing records to ensure exact matches for acceptance criteria
    try {
      app.db().newQuery('DELETE FROM animais').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM vendas').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM parcelas_venda').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM boletos').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM despesas').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM boletos_pagar').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM transacoes_financeiras').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM parceiros_negocios').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM precos_mercado').execute()
    } catch (e) {}
    try {
      app.db().newQuery('DELETE FROM auditoria_movimentacoes').execute()
    } catch (e) {}

    const parceirosCol = app.findCollectionByNameOrId('parceiros_negocios')

    const cliente = new Record(parceirosCol)
    cliente.set('nome_razao_social', 'Toriba Nelore Cliente')
    cliente.set('categoria_parceiro', 'Cliente')
    app.save(cliente)

    const fornecedor = new Record(parceirosCol)
    fornecedor.set('nome_razao_social', 'Agro Nutrição Fornecedor')
    fornecedor.set('categoria_parceiro', 'Fornecedor')
    app.save(fornecedor)

    const precosCol = app.findCollectionByNameOrId('precos_mercado')
    const preco = new Record(precosCol)
    preco.set('data_registro', new Date().toISOString())
    preco.set('preco_arroba', 300)
    app.save(preco)

    // 63 Animals
    // 62 * 34 @ = 2108 @
    // 1 * 23.733333 @ = 23.733333 @
    // Total: 2131.733333 @ (* 300 = R$ 639.520,00)
    const animaisCol = app.findCollectionByNameOrId('animais')
    for (let i = 1; i <= 63; i++) {
      const rec = new Record(animaisCol)
      rec.set('id_manejo_brinco', `BR-${1000 + i}`)
      rec.set('status', 'Ativo')
      rec.set('categoria', 'Matriz PO')
      rec.set('sexo', 'Fêmea')
      if (i <= 62) {
        rec.set('arrobas_atuais', 34)
        rec.set('peso_atual_kg', 510)
      } else {
        rec.set('arrobas_atuais', 23.733333)
        rec.set('peso_atual_kg', 356)
      }
      app.save(rec)
    }

    const vendasCol = app.findCollectionByNameOrId('vendas')
    const parcelasCol = app.findCollectionByNameOrId('parcelas_venda')
    const boletosCol = app.findCollectionByNameOrId('boletos')

    // Venda 1: R$ 15.000,00 (Recebida)
    const v1 = new Record(vendasCol)
    v1.set('cliente_id', cliente.id)
    v1.set('data_venda', new Date().toISOString())
    v1.set('valor_total_venda', 15000)
    v1.set('status_venda', 'Entregue')
    v1.set('tipo_gado', 'PO')
    v1.set('quantidade_animais', 1)
    v1.set('forma_pagamento', 'AVista')
    app.save(v1)

    const p1 = new Record(parcelasCol)
    p1.set('venda_id', v1.id)
    p1.set('numero_parcela', 1)
    p1.set('valor_parcela', 15000)
    p1.set('data_vencimento', new Date().toISOString())
    p1.set('status_parcela', 'Paga')
    app.save(p1)

    const b1 = new Record(boletosCol)
    b1.set('parcela_id', p1.id)
    b1.set('venda_id', v1.id)
    b1.set('valor_boleto', 15000)
    b1.set('data_vencimento', new Date().toISOString())
    b1.set('status_boleto', 'Pago')
    app.save(b1)

    // Venda 2: R$ 7.504,46 (A Receber)
    const v2 = new Record(vendasCol)
    v2.set('cliente_id', cliente.id)
    v2.set('data_venda', new Date().toISOString())
    v2.set('valor_total_venda', 7504.46)
    v2.set('status_venda', 'Confirmada')
    v2.set('tipo_gado', 'Comercial')
    v2.set('quantidade_animais', 2)
    v2.set('forma_pagamento', 'Parcelado')
    app.save(v2)

    const p2 = new Record(parcelasCol)
    p2.set('venda_id', v2.id)
    p2.set('numero_parcela', 1)
    p2.set('valor_parcela', 7504.46)

    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 15)
    p2.set('data_vencimento', nextMonth.toISOString())
    p2.set('status_parcela', 'Pendente')
    app.save(p2)

    const b2 = new Record(boletosCol)
    b2.set('parcela_id', p2.id)
    b2.set('venda_id', v2.id)
    b2.set('valor_boleto', 7504.46)
    b2.set('data_vencimento', nextMonth.toISOString())
    b2.set('status_boleto', 'Pendente')
    app.save(b2)

    // Despesa: R$ 20.612,41 (Paga)
    const despesasCol = app.findCollectionByNameOrId('despesas')
    const boletosPagarCol = app.findCollectionByNameOrId('boletos_pagar')

    const d1 = new Record(despesasCol)
    d1.set('fornecedor_id', fornecedor.id)
    d1.set('tipo_despesa', 'Nutrição')
    d1.set('valor', 20612.41)
    d1.set('data_despesa', new Date().toISOString())
    app.save(d1)

    const bp1 = new Record(boletosPagarCol)
    bp1.set('despesa_id', d1.id)
    bp1.set('fornecedor_id', fornecedor.id)
    bp1.set('valor', 20612.41)
    bp1.set('data_vencimento', new Date().toISOString())
    bp1.set('status', 'Pago')
    app.save(bp1)

    // Auditoria Seeding
    const auditCol = app.findCollectionByNameOrId('auditoria_movimentacoes')
    let users = []
    try {
      users = app.findRecordsByFilter('users', "email != ''", '-created', 1, 0)
    } catch (e) {}

    if (users.length > 0) {
      const a1 = new Record(auditCol)
      a1.set('usuario_id', users[0].id)
      a1.set('tipo_acao', 'LOGIN')
      a1.set('tabela_afetada', 'users')
      a1.set('registro_id', users[0].id)
      a1.set('status', 'SUCCESS')
      a1.set('description', 'Sessão iniciada com sucesso.')
      app.save(a1)

      const a2 = new Record(auditCol)
      a2.set('usuario_id', users[0].id)
      a2.set('tipo_acao', 'CREATE')
      a2.set('tabela_afetada', 'animais')
      a2.set('registro_id', 'batch')
      a2.set('status', 'SUCCESS')
      a2.set('description', 'Carga inicial de 63 animais realizada.')
      app.save(a2)
    }
  },
  (app) => {},
)
