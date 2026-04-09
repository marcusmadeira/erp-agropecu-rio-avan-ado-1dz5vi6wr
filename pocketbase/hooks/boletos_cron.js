cronAdd('boletos_notificacoes', '0 8 * * *', () => {
  const now = new Date()

  const boletos = $app.findRecordsByFilter(
    'boletos',
    "status_boleto != 'Pago' && status_boleto != 'Cancelado'",
    '',
    1000,
    0,
  )

  const users = $app.findRecordsByFilter(
    'users',
    'nivel_acesso = 1 || nivel_acesso = 2',
    '',
    100,
    0,
  )
  const notifCol = $app.findCollectionByNameOrId('notificacoes')

  for (let i = 0; i < boletos.length; i++) {
    const boleto = boletos[i]
    const dataVencimento = boleto.get('data_vencimento')
    if (!dataVencimento) continue

    const venc = new Date(dataVencimento)
    const diffTime = venc.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let shouldNotify = false
    let desc = ''

    if (diffDays === 5) {
      shouldNotify = true
      desc = `O boleto ${boleto.get('numero_boleto') || boleto.id} vence em 5 dias.`
    } else if (diffDays === 0) {
      shouldNotify = true
      desc = `O boleto ${boleto.get('numero_boleto') || boleto.id} vence HOJE.`
    } else if (diffDays === -1) {
      shouldNotify = true
      desc = `O boleto ${boleto.get('numero_boleto') || boleto.id} venceu ontem e está pendente.`
    } else if (diffDays < -1 && Math.abs(diffDays) % 7 === 0) {
      shouldNotify = true
      desc = `O boleto ${boleto.get('numero_boleto') || boleto.id} está atrasado há ${Math.abs(diffDays)} dias.`
    }

    if (shouldNotify) {
      for (let j = 0; j < users.length; j++) {
        const notif = new Record(notifCol)
        notif.set('usuario_id', users[j].id)
        notif.set('tipo_alerta', 'Transação Pendente')
        notif.set('descricao', desc)
        notif.set('lido', false)
        $app.saveNoValidate(notif)
      }
    }
  }
})
