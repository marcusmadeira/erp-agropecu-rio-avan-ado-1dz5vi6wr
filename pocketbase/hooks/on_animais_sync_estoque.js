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
      const mercado = $app.findRecordsByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
        1,
        0,
      )
      if (mercado.length > 0 && mercado[0].getFloat('preco_arroba') > 0) {
        valorArroba = mercado[0].getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba
    const todayStr = new Date().toISOString().split('T')[0]

    let estoque
    try {
      const estoques = $app.findRecordsByFilter(
        'estoque_peso_fazenda',
        'data_calculo >= {:data}',
        '-data_calculo',
        1,
        0,
        { data: todayStr + ' 00:00:00.000Z' },
      )
      if (estoques.length > 0) {
        estoque = estoques[0]
      } else {
        throw new Error('Not found')
      }
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', todayStr + ' 12:00:00.000Z')
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
      const mercado = $app.findRecordsByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
        1,
        0,
      )
      if (mercado.length > 0 && mercado[0].getFloat('preco_arroba') > 0) {
        valorArroba = mercado[0].getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba
    const todayStr = new Date().toISOString().split('T')[0]

    let estoque
    try {
      const estoques = $app.findRecordsByFilter(
        'estoque_peso_fazenda',
        'data_calculo >= {:data}',
        '-data_calculo',
        1,
        0,
        { data: todayStr + ' 00:00:00.000Z' },
      )
      if (estoques.length > 0) {
        estoque = estoques[0]
      } else {
        throw new Error('Not found')
      }
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', todayStr + ' 12:00:00.000Z')
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
      const mercado = $app.findRecordsByFilter(
        'precos_mercado',
        'preco_arroba > 0',
        '-data_registro',
        1,
        0,
      )
      if (mercado.length > 0 && mercado[0].getFloat('preco_arroba') > 0) {
        valorArroba = mercado[0].getFloat('preco_arroba')
      }
    } catch (_) {}

    const valorTotal = totalArrobas * valorArroba
    const todayStr = new Date().toISOString().split('T')[0]

    let estoque
    try {
      const estoques = $app.findRecordsByFilter(
        'estoque_peso_fazenda',
        'data_calculo >= {:data}',
        '-data_calculo',
        1,
        0,
        { data: todayStr + ' 00:00:00.000Z' },
      )
      if (estoques.length > 0) {
        estoque = estoques[0]
      } else {
        throw new Error('Not found')
      }
    } catch (_) {
      const col = $app.findCollectionByNameOrId('estoque_peso_fazenda')
      estoque = new Record(col)
      estoque.set('data_calculo', todayStr + ' 12:00:00.000Z')
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
