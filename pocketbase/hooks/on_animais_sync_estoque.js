onRecordAfterCreateSuccess((e) => {
  try {
    const records = $app.findRecordsByFilter('animais', "status = 'Ativo'", '', 0, 0)

    let totalCabecas = 0
    let totalPesoKg = 0

    for (const r of records) {
      totalCabecas++
      totalPesoKg += r.getFloat('peso_atual_kg')
    }

    const totalArrobas = totalPesoKg / 15.0

    let valorArroba = 250
    try {
      const mercado = $app.findFirstRecordByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
      )
      if (mercado && mercado.getFloat('preco_arroba') > 0) {
        valorArroba = mercado.getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba

    const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

    let estoque
    try {
      estoque = $app.findFirstRecordByFilter(
        'estoque_peso_fazenda',
        `data_calculo >= '${today.substring(0, 10)} 00:00:00'`,
      )
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', today)
    }

    estoque.set('total_cabecas', totalCabecas)
    estoque.set('total_peso_kg', totalPesoKg)
    estoque.set('total_arrobas', totalArrobas)
    estoque.set('valor_total_rebanho', valorTotal)

    $app.save(estoque)
  } catch (err) {
    $app.logger().error('Erro ao sincronizar estoque: ' + err.message)
  }

  e.next()
}, 'animais')

onRecordAfterUpdateSuccess((e) => {
  try {
    const records = $app.findRecordsByFilter('animais', "status = 'Ativo'", '', 0, 0)

    let totalCabecas = 0
    let totalPesoKg = 0

    for (const r of records) {
      totalCabecas++
      totalPesoKg += r.getFloat('peso_atual_kg')
    }

    const totalArrobas = totalPesoKg / 15.0

    let valorArroba = 250
    try {
      const mercado = $app.findFirstRecordByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
      )
      if (mercado && mercado.getFloat('preco_arroba') > 0) {
        valorArroba = mercado.getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba

    const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

    let estoque
    try {
      estoque = $app.findFirstRecordByFilter(
        'estoque_peso_fazenda',
        `data_calculo >= '${today.substring(0, 10)} 00:00:00'`,
      )
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', today)
    }

    estoque.set('total_cabecas', totalCabecas)
    estoque.set('total_peso_kg', totalPesoKg)
    estoque.set('total_arrobas', totalArrobas)
    estoque.set('valor_total_rebanho', valorTotal)

    $app.save(estoque)
  } catch (err) {
    $app.logger().error('Erro ao sincronizar estoque: ' + err.message)
  }

  e.next()
}, 'animais')

onRecordAfterDeleteSuccess((e) => {
  try {
    const records = $app.findRecordsByFilter('animais', "status = 'Ativo'", '', 0, 0)

    let totalCabecas = 0
    let totalPesoKg = 0

    for (const r of records) {
      totalCabecas++
      totalPesoKg += r.getFloat('peso_atual_kg')
    }

    const totalArrobas = totalPesoKg / 15.0

    let valorArroba = 250
    try {
      const mercado = $app.findFirstRecordByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
      )
      if (mercado && mercado.getFloat('preco_arroba') > 0) {
        valorArroba = mercado.getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba

    const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

    let estoque
    try {
      estoque = $app.findFirstRecordByFilter(
        'estoque_peso_fazenda',
        `data_calculo >= '${today.substring(0, 10)} 00:00:00'`,
      )
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', today)
    }

    estoque.set('total_cabecas', totalCabecas)
    estoque.set('total_peso_kg', totalPesoKg)
    estoque.set('total_arrobas', totalArrobas)
    estoque.set('valor_total_rebanho', valorTotal)

    $app.save(estoque)
  } catch (err) {
    $app.logger().error('Erro ao sincronizar estoque: ' + err.message)
  }

  e.next()
}, 'animais')
