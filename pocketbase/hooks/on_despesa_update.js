onRecordAfterUpdateSuccess((e) => {
  const despesa = e.record
  const qtd = despesa.getInt('quantidade_parcelas') || 1
  const valorTotal = despesa.getFloat('valor_total') || despesa.getFloat('valor')

  const boletos = $app.findRecordsByFilter(
    'boletos_pagar',
    `despesa_id='${despesa.id}'`,
    'data_vencimento',
    1000,
    0,
  )

  let hasPago = false
  for (let i = 0; i < boletos.length; i++) {
    if (boletos[i].get('status') === 'Pago') {
      hasPago = true
      break
    }
  }

  // If no boleto is paid, we can safely delete and recreate
  if (!hasPago) {
    for (let i = 0; i < boletos.length; i++) {
      $app.delete(boletos[i])
    }

    const baseParcela = Math.floor((valorTotal / qtd) * 100) / 100
    let diff = Math.round((valorTotal - baseParcela * qtd) * 100) / 100

    let vencimentos = []
    const rawVenc = despesa.get('vencimentos_parcelas')
    if (Array.isArray(rawVenc)) {
      vencimentos = rawVenc
    } else if (typeof rawVenc === 'string' && rawVenc) {
      try {
        const parsed = JSON.parse(rawVenc)
        if (Array.isArray(parsed)) vencimentos = parsed
        else vencimentos = [rawVenc]
      } catch (err) {
        vencimentos = rawVenc.includes(',') ? rawVenc.split(',').map((s) => s.trim()) : [rawVenc]
      }
    }

    const parseDate = (dStr) => {
      if (!dStr || typeof dStr !== 'string') return null
      const match = dStr.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        const dt = new Date(Date.UTC(match[1], parseInt(match[2]) - 1, match[3]))
        if (!isNaN(dt.getTime())) return dt
      }
      return null
    }

    let baseDate = parseDate(despesa.getString('data_despesa'))
    if (!baseDate) {
      const now = new Date()
      baseDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    }

    const boletosPagarCol = $app.findCollectionByNameOrId('boletos_pagar')
    for (let i = 0; i < qtd; i++) {
      let dt = vencimentos.length > i ? parseDate(vencimentos[i]) : null
      if (!dt) {
        dt = new Date(baseDate.getTime())
        dt.setUTCMonth(dt.getUTCMonth() + i)
      }
      const year = dt.getUTCFullYear()
      const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
      const day = String(dt.getUTCDate()).padStart(2, '0')
      const finalDateStr = `${year}-${month}-${day} 12:00:00.000Z`

      let currentValor = baseParcela
      if (i === qtd - 1) currentValor += diff
      currentValor = Math.round(currentValor * 100) / 100

      const record = new Record(boletosPagarCol)
      record.set('despesa_id', despesa.id)
      record.set('fornecedor_id', despesa.getString('fornecedor_id'))
      record.set('valor', currentValor)
      record.set('data_vencimento', finalDateStr)
      record.set('status', 'Pendente')
      record.set('numero_boleto', `PARC-${i + 1}/${qtd}`)
      $app.save(record)
    }
  } else {
    let totalPago = 0
    let pagasCount = 0
    const pendingBoletos = []
    for (let i = 0; i < boletos.length; i++) {
      if (boletos[i].get('status') === 'Pago') {
        totalPago += boletos[i].getFloat('valor')
        pagasCount++
      } else {
        pendingBoletos.push(boletos[i])
      }
    }

    const remainingToPay = valorTotal - totalPago
    const remainingQtd = qtd - pagasCount

    if (remainingQtd > 0) {
      for (let i = 0; i < pendingBoletos.length; i++) {
        $app.delete(pendingBoletos[i])
      }

      const baseParcela = Math.floor((remainingToPay / remainingQtd) * 100) / 100
      let diff = Math.round((remainingToPay - baseParcela * remainingQtd) * 100) / 100

      let vencimentos = []
      const rawVenc = despesa.get('vencimentos_parcelas')
      if (Array.isArray(rawVenc)) {
        vencimentos = rawVenc
      }

      const parseDate = (dStr) => {
        if (!dStr || typeof dStr !== 'string') return null
        const match = dStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
          const dt = new Date(Date.UTC(match[1], parseInt(match[2]) - 1, match[3]))
          if (!isNaN(dt.getTime())) return dt
        }
        return null
      }

      const boletosPagarCol = $app.findCollectionByNameOrId('boletos_pagar')
      for (let i = 0; i < remainingQtd; i++) {
        const offsetIdx = pagasCount + i
        let dt = vencimentos.length > offsetIdx ? parseDate(vencimentos[offsetIdx]) : null
        if (!dt) {
          dt = new Date()
        }
        const year = dt.getUTCFullYear()
        const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
        const day = String(dt.getUTCDate()).padStart(2, '0')
        const finalDateStr = `${year}-${month}-${day} 12:00:00.000Z`

        let currentValor = baseParcela
        if (i === remainingQtd - 1) currentValor += diff
        currentValor = Math.round(currentValor * 100) / 100

        const record = new Record(boletosPagarCol)
        record.set('despesa_id', despesa.id)
        record.set('fornecedor_id', despesa.getString('fornecedor_id'))
        record.set('valor', currentValor)
        record.set('data_vencimento', finalDateStr)
        record.set('status', 'Pendente')
        record.set('numero_boleto', `PARC-${offsetIdx + 1}/${qtd}`)
        $app.save(record)
      }
    } else {
      for (let i = 0; i < pendingBoletos.length; i++) {
        $app.delete(pendingBoletos[i])
      }
    }
  }

  return e.next()
}, 'despesas')
