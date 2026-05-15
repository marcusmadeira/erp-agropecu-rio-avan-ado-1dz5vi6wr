onRecordAfterDeleteSuccess((e) => {
  const despesaId = e.record.id
  const boletos = $app.findRecordsByFilter(
    'boletos_pagar',
    `despesa_id='${despesaId}'`,
    '',
    1000,
    0,
  )

  for (let i = 0; i < boletos.length; i++) {
    try {
      const pagamentos = $app.findRecordsByFilter(
        'pagamentos_realizados',
        `boleto_pagar_id='${boletos[i].id}'`,
        '',
        100,
        0,
      )
      for (let j = 0; j < pagamentos.length; j++) {
        $app.delete(pagamentos[j])
      }
      $app.delete(boletos[i])
    } catch (err) {
      console.log('Erro ao excluir boletos/pagamentos cascata:', err)
    }
  }
  return e.next()
}, 'despesas')
