onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const boletoId = record.get('boleto_id')

  if (boletoId) {
    try {
      const boleto = $app.findRecordById('boletos', boletoId)
      if (boleto.get('status_boleto') !== 'Pago') {
        boleto.set('status_boleto', 'Pago')
        boleto.set('data_pagamento', record.get('data_recebimento'))
        boleto.set('valor_pago', record.get('valor_recebido'))
        $app.save(boleto)
      }
    } catch (err) {
      $app.logger().error('Erro ao atualizar boleto no recebimento', 'error', err)
    }
  }

  e.next()
}, 'recebimentos_vendas')
