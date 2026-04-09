migrate(
  (app) => {
    const parceirosCol = app.findCollectionByNameOrId('parceiros_negocios')
    const p1 = new Record(parceirosCol)
    p1.set('nome_razao_social', 'Fazenda Boi Gordo S/A')
    p1.set('tipo_documento', 'CNPJ')
    p1.set('numero_documento', '12.345.678/0001-99')
    p1.set('categoria_parceiro', 'Fornecedor')
    p1.set('status', 'Ativo')

    const p2 = new Record(parceirosCol)
    p2.set('nome_razao_social', 'João da Silva')
    p2.set('tipo_documento', 'CPF')
    p2.set('numero_documento', '123.456.789-00')
    p2.set('categoria_parceiro', 'Cliente')
    p2.set('status', 'Ativo')

    try {
      app.findFirstRecordByData('parceiros_negocios', 'numero_documento', '12.345.678/0001-99')
    } catch (_) {
      app.save(p1)
    }

    try {
      app.findFirstRecordByData('parceiros_negocios', 'numero_documento', '123.456.789-00')
    } catch (_) {
      app.save(p2)
    }

    const lotesCol = app.findCollectionByNameOrId('lotes')
    const l1 = new Record(lotesCol)
    l1.set('nome_lote', 'Lote 01 - Bezerros')
    l1.set('centro_custo', 'CC01-Nelore PO')
    l1.set('quantidade_cabecas', 50)
    l1.set('peso_medio_lote', 250.5)
    l1.set('custo_acumulado_nutricao', 15000.0)

    const l2 = new Record(lotesCol)
    l2.set('nome_lote', 'Lote 02 - Novilhas')
    l2.set('centro_custo', 'CC02-Comercial TIP')
    l2.set('quantidade_cabecas', 30)
    l2.set('peso_medio_lote', 320.0)
    l2.set('custo_acumulado_nutricao', 12000.0)

    let savedL1, savedL2
    try {
      savedL1 = app.findFirstRecordByData('lotes', 'nome_lote', 'Lote 01 - Bezerros')
    } catch (_) {
      app.save(l1)
      savedL1 = l1
    }

    try {
      savedL2 = app.findFirstRecordByData('lotes', 'nome_lote', 'Lote 02 - Novilhas')
    } catch (_) {
      app.save(l2)
      savedL2 = l2
    }

    const animaisCol = app.findCollectionByNameOrId('animais')
    const a1 = new Record(animaisCol)
    a1.set('id_manejo_brinco', 'BR-1001')
    a1.set('rgd_rgn_abcz', 'ABCZ1234')
    a1.set('categoria', 'Bezerro')
    a1.set('status', 'Ativo')
    a1.set('lote_atual', savedL1.id)
    a1.set('peso_atual_kg', 255.0)
    a1.set('genealogia_pai', 'Touro Alpha')
    a1.set('genealogia_mae', 'Matriz Beta')
    a1.set('custo_variavel_acumulado', 300.0)

    const a2 = new Record(animaisCol)
    a2.set('id_manejo_brinco', 'BR-1002')
    a2.set('categoria', 'Novilha TIP')
    a2.set('status', 'Ativo')
    a2.set('lote_atual', savedL2.id)
    a2.set('peso_atual_kg', 325.0)
    a2.set('custo_variavel_acumulado', 400.0)

    try {
      app.findFirstRecordByData('animais', 'id_manejo_brinco', 'BR-1001')
    } catch (_) {
      app.save(a1)
    }

    try {
      app.findFirstRecordByData('animais', 'id_manejo_brinco', 'BR-1002')
    } catch (_) {
      app.save(a2)
    }
  },
  (app) => {
    try {
      const a1 = app.findFirstRecordByData('animais', 'id_manejo_brinco', 'BR-1001')
      app.delete(a1)
    } catch (_) {}
    try {
      const a2 = app.findFirstRecordByData('animais', 'id_manejo_brinco', 'BR-1002')
      app.delete(a2)
    } catch (_) {}

    try {
      const l1 = app.findFirstRecordByData('lotes', 'nome_lote', 'Lote 01 - Bezerros')
      app.delete(l1)
    } catch (_) {}
    try {
      const l2 = app.findFirstRecordByData('lotes', 'nome_lote', 'Lote 02 - Novilhas')
      app.delete(l2)
    } catch (_) {}

    try {
      const p1 = app.findFirstRecordByData(
        'parceiros_negocios',
        'numero_documento',
        '12.345.678/0001-99',
      )
      app.delete(p1)
    } catch (_) {}
    try {
      const p2 = app.findFirstRecordByData(
        'parceiros_negocios',
        'numero_documento',
        '123.456.789-00',
      )
      app.delete(p2)
    } catch (_) {}
  },
)
