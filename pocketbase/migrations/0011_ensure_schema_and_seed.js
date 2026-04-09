migrate(
  (app) => {
    // 1. Ensure Indexes for Collections
    const parceirosCol = app.findCollectionByNameOrId('parceiros_negocios')
    parceirosCol.addIndex('idx_parceiros_numero_documento', false, 'numero_documento', '')
    app.save(parceirosCol)

    const lotesCol = app.findCollectionByNameOrId('lotes')
    lotesCol.addIndex('idx_lotes_nome_lote', false, 'nome_lote', '')
    app.save(lotesCol)

    const animaisCol = app.findCollectionByNameOrId('animais')
    animaisCol.addIndex('idx_animais_id_manejo_brinco', false, 'id_manejo_brinco', '')
    app.save(animaisCol)

    // 2. Ensure seed user remains primary administrator
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      admin.set('nivel_acesso', 1)
      admin.setVerified(true)
      app.save(admin)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('marcusmadeira@yahoo.com.br')
      record.setPassword('Skip@Pass123!')
      record.setVerified(true)
      record.set('name', 'Marcus Madeira')
      record.set('nivel_acesso', 1)
      app.save(record)
    }

    // 3. Seed Parceiros
    const parceirosData = [
      {
        nome_razao_social: 'Agropecuária Vale Verde',
        tipo_documento: 'CNPJ',
        numero_documento: '12345678000199',
        contato_whatsapp: '11999999999',
        email: 'contato@valeverde.com',
        categoria_parceiro: 'Fornecedor',
        status: 'Ativo',
      },
      {
        nome_razao_social: 'Frigorífico Boi Gordo',
        tipo_documento: 'CNPJ',
        numero_documento: '98765432000188',
        contato_whatsapp: '11988888888',
        email: 'compras@boigordo.com',
        categoria_parceiro: 'Cliente',
        status: 'Ativo',
      },
      {
        nome_razao_social: 'João Silva Transportes',
        tipo_documento: 'CPF',
        numero_documento: '12345678901',
        contato_whatsapp: '11977777777',
        email: 'joao@transportes.com',
        categoria_parceiro: 'Transportadora',
        status: 'Ativo',
      },
    ]

    for (const p of parceirosData) {
      try {
        app.findFirstRecordByData('parceiros_negocios', 'numero_documento', p.numero_documento)
      } catch (_) {
        const rec = new Record(parceirosCol)
        rec.set('nome_razao_social', p.nome_razao_social)
        rec.set('tipo_documento', p.tipo_documento)
        rec.set('numero_documento', p.numero_documento)
        rec.set('contato_whatsapp', p.contato_whatsapp)
        rec.set('email', p.email)
        rec.set('categoria_parceiro', p.categoria_parceiro)
        rec.set('status', p.status)
        app.save(rec)
      }
    }

    // 4. Seed Lotes
    const lotesData = [
      {
        nome_lote: 'Lote Confinamento A1',
        centro_custo: 'CC02-Comercial TIP',
        quantidade_cabecas: 120,
        peso_medio_lote: 450,
        custo_acumulado_nutricao: 15000.5,
      },
      {
        nome_lote: 'Matrizes Elite 2023',
        centro_custo: 'CC01-Nelore PO',
        quantidade_cabecas: 45,
        peso_medio_lote: 520,
        custo_acumulado_nutricao: 8500.0,
      },
    ]

    const lotesMap = {}
    for (const l of lotesData) {
      let rec
      try {
        rec = app.findFirstRecordByData('lotes', 'nome_lote', l.nome_lote)
      } catch (_) {
        rec = new Record(lotesCol)
        rec.set('nome_lote', l.nome_lote)
        rec.set('centro_custo', l.centro_custo)
        rec.set('quantidade_cabecas', l.quantidade_cabecas)
        rec.set('peso_medio_lote', l.peso_medio_lote)
        rec.set('custo_acumulado_nutricao', l.custo_acumulado_nutricao)
        app.save(rec)
      }
      lotesMap[l.nome_lote] = rec.id
    }

    // 5. Seed Animais
    const animaisData = [
      {
        id_manejo_brinco: 'BR-2023-001',
        rgd_rgn_abcz: 'NELO1234',
        categoria: 'Touro PO',
        status: 'Ativo',
        lote_atual: lotesMap['Matrizes Elite 2023'],
        peso_atual_kg: 950,
        genealogia_pai: 'Backup',
        genealogia_mae: 'Matriz 10',
        custo_variavel_acumulado: 3200.0,
      },
      {
        id_manejo_brinco: 'BR-2023-002',
        rgd_rgn_abcz: 'NELO5678',
        categoria: 'Matriz PO',
        status: 'Ativo',
        lote_atual: lotesMap['Matrizes Elite 2023'],
        peso_atual_kg: 540,
        genealogia_pai: 'Rambo',
        genealogia_mae: 'Matriz 22',
        custo_variavel_acumulado: 1800.0,
      },
      {
        id_manejo_brinco: 'TIP-2024-101',
        rgd_rgn_abcz: '',
        categoria: 'Garrote TIP',
        status: 'Em Engorda',
        lote_atual: lotesMap['Lote Confinamento A1'],
        peso_atual_kg: 380,
        genealogia_pai: '',
        genealogia_mae: '',
        custo_variavel_acumulado: 450.0,
      },
    ]

    for (const a of animaisData) {
      try {
        app.findFirstRecordByData('animais', 'id_manejo_brinco', a.id_manejo_brinco)
      } catch (_) {
        const rec = new Record(animaisCol)
        rec.set('id_manejo_brinco', a.id_manejo_brinco)
        rec.set('rgd_rgn_abcz', a.rgd_rgn_abcz)
        rec.set('categoria', a.categoria)
        rec.set('status', a.status)
        if (a.lote_atual) rec.set('lote_atual', a.lote_atual)
        rec.set('peso_atual_kg', a.peso_atual_kg)
        rec.set('genealogia_pai', a.genealogia_pai)
        rec.set('genealogia_mae', a.genealogia_mae)
        rec.set('custo_variavel_acumulado', a.custo_variavel_acumulado)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
