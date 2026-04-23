onRecordAfterCreateSuccess((e) => {
  const despesa = e.record
  const qtd = despesa.getInt('quantidade_parcelas') || 1
  const vencimentos = despesa.get('vencimentos_parcelas') || []
  const valorParcela = despesa.getFloat('valor_parcela') || despesa.getFloat('valor')
  const fornecedorId = despesa.getString('fornecedor_id')

  const boletosPagarCol = $app.findCollectionByNameOrId('boletos_pagar')

  for (let i = 0; i < qtd; i++) {
    const dataVenc = vencimentos[i] || despesa.getString('data_despesa')
    const record = new Record(boletosPagarCol)
    record.set('despesa_id', despesa.id)

    if (fornecedorId) {
      record.set('fornecedor_id', fornecedorId)
    }

    record.set('valor', valorParcela)
    record.set('data_vencimento', dataVenc)
    record.set('status', 'Pendente')
    record.set('numero_boleto', `PARC-${i + 1}/${qtd}`)

    $app.save(record)
  }

  return e.next()
}, 'despesas')
