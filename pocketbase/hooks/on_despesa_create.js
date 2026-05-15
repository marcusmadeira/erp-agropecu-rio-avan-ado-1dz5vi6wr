onRecordAfterCreateSuccess((e) => {
  const despesa = e.record
  const qtd = despesa.getInt('quantidade_parcelas') || 1
  const valorTotal = despesa.getFloat('valor_total') || despesa.getFloat('valor')

  // Calculate exact values for rounding
  const baseParcela = Math.floor((valorTotal / qtd) * 100) / 100
  let diff = Math.round((valorTotal - baseParcela * qtd) * 100) / 100

  const fornecedorId = despesa.getString('fornecedor_id')
  const dataDespesaRaw = despesa.getString('data_despesa')

  let vencimentos = []
  const rawVenc = despesa.get('vencimentos_parcelas')

  if (Array.isArray(rawVenc)) {
    vencimentos = rawVenc
  } else if (typeof rawVenc === 'string' && rawVenc) {
    try {
      const parsed = JSON.parse(rawVenc)
      if (Array.isArray(parsed)) {
        vencimentos = parsed
      } else {
        vencimentos = [rawVenc]
      }
    } catch (err) {
      if (rawVenc.includes(',')) {
        vencimentos = rawVenc.split(',').map((s) => s.trim())
      } else {
        vencimentos = [rawVenc]
      }
    }
  }

  const parseDate = (dStr) => {
    if (!dStr || typeof dStr !== 'string') return null
    const match = dStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      // Accept reasonable years to prevent 1970 bugs
      if (year > 2000 && year < 2100) {
        const dt = new Date(Date.UTC(year, month, day))
        if (!isNaN(dt.getTime())) {
          return dt
        }
      }
    }
    return null
  }

  let baseDate = parseDate(dataDespesaRaw)
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
    if (i === qtd - 1) {
      currentValor += diff
    }
    currentValor = Math.round(currentValor * 100) / 100

    const record = new Record(boletosPagarCol)
    record.set('despesa_id', despesa.id)

    if (fornecedorId) {
      record.set('fornecedor_id', fornecedorId)
    }

    record.set('valor', currentValor)
    record.set('data_vencimento', finalDateStr)
    record.set('status', 'Pendente')
    record.set('numero_boleto', `PARC-${i + 1}/${qtd}`)

    $app.save(record)
  }

  return e.next()
}, 'despesas')
