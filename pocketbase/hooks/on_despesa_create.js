onRecordAfterCreateSuccess((e) => {
  const despesa = e.record
  const qtd = despesa.getInt('quantidade_parcelas') || 1
  let valorParcela = despesa.getFloat('valor_parcela')

  if (!valorParcela) {
    const total = despesa.getFloat('valor')
    valorParcela = total > 0 ? total / qtd : 0
  }

  const fornecedorId = despesa.getString('fornecedor_id')
  const dataDespesaRaw = despesa.getString('data_despesa')

  let vencimentos = []
  const rawVenc = despesa.get('vencimentos_parcelas')

  if (Array.isArray(rawVenc)) {
    vencimentos = rawVenc
  } else if (typeof rawVenc === 'string') {
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
      if (year > 1970) {
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
    baseDate = new Date()
  }

  const boletosPagarCol = $app.findCollectionByNameOrId('boletos_pagar')

  for (let i = 0; i < qtd; i++) {
    let dt = parseDate(vencimentos[i])

    if (!dt) {
      dt = new Date(baseDate.getTime())
      dt.setUTCMonth(dt.getUTCMonth() + i)
    }

    const year = dt.getUTCFullYear()
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dt.getUTCDate()).padStart(2, '0')
    const finalDateStr = `${year}-${month}-${day} 12:00:00.000Z`

    const record = new Record(boletosPagarCol)
    record.set('despesa_id', despesa.id)

    if (fornecedorId) {
      record.set('fornecedor_id', fornecedorId)
    }

    record.set('valor', valorParcela)
    record.set('data_vencimento', finalDateStr)
    record.set('status', 'Pendente')
    record.set('numero_boleto', `PARC-${i + 1}/${qtd}`)

    $app.save(record)
  }

  return e.next()
}, 'despesas')
