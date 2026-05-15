cronAdd('atualizar_inadimplencia', '0 1 * * *', () => {
  const todayStr = new Date().toISOString().split('T')[0]

  // Update parcelas_venda
  const parcelas = $app.findRecordsByFilter(
    'parcelas_venda',
    `status_parcela = 'Pendente' && data_vencimento < '${todayStr}'`,
    '',
    0,
    0,
  )
  for (let p of parcelas) {
    p.set('status_parcela', 'Atrasada')
    $app.saveNoValidate(p)
  }

  // Update boletos
  const boletos = $app.findRecordsByFilter(
    'boletos',
    `(status_boleto = 'Pendente' || status_boleto = 'Gerado' || status_boleto = 'Enviado') && data_vencimento < '${todayStr}'`,
    '',
    0,
    0,
  )
  for (let b of boletos) {
    b.set('status_boleto', 'Atrasado')
    $app.saveNoValidate(b)
  }
})
