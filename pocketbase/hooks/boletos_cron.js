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

    // Integração WhatsApp (D-2, D-0, D+1)
    let tipoMensagem = ''
    if (diffDays === 2) tipoMensagem = 'D-2'
    else if (diffDays === 0) tipoMensagem = 'D-0'
    else if (diffDays === -1) tipoMensagem = 'D+1'

    if (tipoMensagem) {
      let baseUrl = $os.getenv('PB_INSTANCE_URL') || 'http://127.0.0.1:8090'
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
      try {
        $http.send({
          url: baseUrl + '/backend/v1/cobranca_whatsapp',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boleto_id: boleto.id, tipo_mensagem: tipoMensagem }),
          timeout: 10,
        })
      } catch (err) {
        console.log('Erro ao enviar cobranca via whatsapp na cron:', err.message)
      }
    }
  }
})
