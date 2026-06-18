onRecordAfterCreateSuccess((e) => {
  const parcelas = e.record.getInt('numero_parcelas')
  if (parcelas <= 0) return e.next()

  const valorTotal = e.record.getFloat('valor_total_venda')
  const valorEntrada = e.record.getFloat('valor_entrada') || 0
  const dataVencimentoStr = e.record.getString('data_venda')

  const colParcelas = $app.findCollectionByNameOrId('parcelas_venda')

  const valorFinanciado = valorTotal - valorEntrada
  const valorParcela = valorFinanciado / parcelas

  let baseDate = new Date(dataVencimentoStr || Date.now())

  for (let i = 1; i <= parcelas; i++) {
    const rec = new Record(colParcelas)
    rec.set('venda_id', e.record.id)
    rec.set('numero_parcela', i)
    rec.set('valor_parcela', valorParcela)

    const vDate = new Date(baseDate.getTime())
    vDate.setMonth(vDate.getMonth() + i)

    rec.set('data_vencimento', vDate.toISOString().split('T')[0] + ' 12:00:00.000Z')
    rec.set('status_parcela', 'Pendente')

    $app.save(rec)
  }

  return e.next()
}, 'vendas')
