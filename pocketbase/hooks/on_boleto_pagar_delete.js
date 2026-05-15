onRecordAfterDeleteSuccess((e) => {
  const boletoId = e.record.id
  try {
    const pagamentos = $app.findRecordsByFilter(
      'pagamentos_realizados',
      `boleto_pagar_id='${boletoId}'`,
      '',
      100,
      0,
    )
    for (let i = 0; i < pagamentos.length; i++) {
      $app.delete(pagamentos[i])
    }
  } catch (err) {
    console.log('Erro ao excluir pagamentos relacionados ao boleto:', err)
  }
  return e.next()
}, 'boletos_pagar')
