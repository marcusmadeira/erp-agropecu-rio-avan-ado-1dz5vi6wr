onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const boletoId = record.get('boleto_pagar_id')
  if (boletoId) {
    try {
      const boleto = $app.findRecordById('boletos_pagar', boletoId)
      boleto.set('status', 'Pago')
      boleto.set('data_pagamento', record.get('data_pagamento'))
      $app.save(boleto)
    } catch (err) {
      console.log('Erro ao atualizar boleto: ' + err)
    }
  }
  e.next()
}, 'pagamentos_realizados')
