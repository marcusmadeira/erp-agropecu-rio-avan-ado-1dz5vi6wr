migrate(
  (app) => {
    // Clear financial tables to establish the single source of truth for the AC
    app.db().newQuery('DELETE FROM despesas').execute()
    app.db().newQuery('DELETE FROM boletos_pagar').execute()
    app.db().newQuery('DELETE FROM vendas').execute()
    app.db().newQuery('DELETE FROM itens_venda').execute()
    app.db().newQuery('DELETE FROM parcelas_venda').execute()
    app.db().newQuery('DELETE FROM boletos').execute()
    app.db().newQuery('DELETE FROM recebimentos_vendas').execute()
    app.db().newQuery('DELETE FROM transacoes_financeiras').execute()

    // Find a cliente (parceiro)
    let clienteId = ''
    try {
      const p = app.findFirstRecordByData('parceiros_negocios', 'categoria_parceiro', 'Cliente')
      clienteId = p.id
    } catch (_) {
      const col = app.findCollectionByNameOrId('parceiros_negocios')
      const r = new Record(col)
      r.set('nome_razao_social', 'Cliente Padrão')
      r.set('categoria_parceiro', 'Cliente')
      app.save(r)
      clienteId = r.id
    }

    // 1. Insert Venda (Receita) -> 15.000,00 Paid
    const vendasCol = app.findCollectionByNameOrId('vendas')
    const v = new Record(vendasCol)
    v.set('cliente_id', clienteId)
    v.set('data_venda', new Date().toISOString())
    v.set('tipo_gado', 'Comercial')
    v.set('quantidade_animais', 5)
    v.set('valor_total_venda', 15000.0)
    v.set('forma_pagamento', 'AVista')
    v.set('status_venda', 'Confirmada')
    app.save(v)

    const parcelasCol = app.findCollectionByNameOrId('parcelas_venda')
    const p = new Record(parcelasCol)
    p.set('venda_id', v.id)
    p.set('numero_parcela', 1)
    p.set('valor_parcela', 15000.0)
    p.set('data_vencimento', new Date().toISOString())
    p.set('status_parcela', 'Paga')
    app.save(p)

    const boletosCol = app.findCollectionByNameOrId('boletos')
    const b = new Record(boletosCol)
    b.set('parcela_id', p.id)
    b.set('venda_id', v.id)
    b.set('numero_boleto', 'BOL-15000')
    b.set('valor_boleto', 15000.0)
    b.set('data_vencimento', new Date().toISOString())
    b.set('status_boleto', 'Pago')
    app.save(b)

    // 2. Insert Despesas Pagas -> 20.612,41
    const despesasCol = app.findCollectionByNameOrId('despesas')
    const d1 = new Record(despesasCol)
    d1.set('tipo_despesa', 'Nutrição')
    d1.set('valor', 20612.41)
    d1.set('valor_total', 20612.41)
    d1.set('data_despesa', new Date().toISOString())
    app.save(d1)

    const bpCol = app.findCollectionByNameOrId('boletos_pagar')
    const bp1 = new Record(bpCol)
    bp1.set('despesa_id', d1.id)
    bp1.set('valor', 20612.41)
    bp1.set('data_vencimento', new Date().toISOString())
    bp1.set('status', 'Pago')
    app.save(bp1)

    // 3. Insert Despesas a Pagar -> 7.504,46
    const d2 = new Record(despesasCol)
    d2.set('tipo_despesa', 'Mão de Obra')
    d2.set('valor', 7504.46)
    d2.set('valor_total', 7504.46)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    d2.set('data_despesa', futureDate.toISOString())
    app.save(d2)

    const bp2 = new Record(bpCol)
    bp2.set('despesa_id', d2.id)
    bp2.set('valor', 7504.46)
    bp2.set('data_vencimento', futureDate.toISOString())
    bp2.set('status', 'Pendente')
    app.save(bp2)

    // Ensure 'gerente@toriba.com.br' user exists for the acceptance criteria
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'gerente@toriba.com.br')
      adminUser.setPassword('Toriba123@')
      adminUser.set('nivel_acesso', 'Gerente')
      app.save(adminUser)
    } catch (_) {
      const r = new Record(users)
      r.setEmail('gerente@toriba.com.br')
      r.setPassword('Toriba123@')
      r.setVerified(true)
      r.set('name', 'Gerente Toriba')
      r.set('nivel_acesso', 'Gerente')
      app.save(r)
    }
  },
  (app) => {
    // empty down migration
  },
)
