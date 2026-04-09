onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  if (record.get('status_boleto') === 'Pago') {
    const parcelaId = record.get('parcela_id')
    if (parcelaId) {
      try {
        const parcela = $app.findRecordById('parcelas_venda', parcelaId)
        if (parcela.get('status_parcela') !== 'Paga') {
          parcela.set('status_parcela', 'Paga')
          if (!parcela.get('data_pagamento')) {
            parcela.set('data_pagamento', new Date().toISOString().replace('T', ' '))
          }
          $app.saveNoValidate(parcela)
        }
      } catch (err) {
        console.log('Error updating parcela on boleto payment:', err)
      }
    }
  }
  e.next()
}, 'boletos')
