onRecordAfterDeleteSuccess((e) => {
  const boletoId = e.record.get('boleto_pagar_id')
  if (boletoId) {
    try {
      const boleto = $app.findRecordById('boletos_pagar', boletoId)
      boleto.set('status', 'Pendente')
      boleto.set('data_pagamento', '')
      $app.save(boleto)
    } catch (err) {
      console.log('Erro ao reverter boleto para pendente:', err)
    }
  }
  return e.next()
}, 'pagamentos_realizados')
