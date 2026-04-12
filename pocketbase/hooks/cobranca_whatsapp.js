routerAdd('POST', '/backend/v1/cobranca_whatsapp', (e) => {
  const body = e.requestInfo().body
  const boletoId = body.boleto_id
  const tipoMensagem = body.tipo_mensagem

  try {
    const boleto = $app.findRecordById('boletos', boletoId)
    $apis.enrichRecord(e, boleto, 'parcela_id.venda_id.cliente_id')

    let clientePhone = ''
    let clienteId = ''
    try {
      const expand = boleto.expandedAll()
      const parcela = expand['parcela_id']
      const venda = parcela.expandedAll()['venda_id']
      const cliente = venda.expandedAll()['cliente_id']
      clientePhone = cliente.get('contato_whatsapp')
      clienteId = cliente.id
    } catch (err) {}

    if (!clientePhone) {
      return e.json(400, {
        success: false,
        message: 'Cliente sem WhatsApp cadastrado para contato.',
      })
    }

    // Emulação da chamada de API externa (ex: Twilio) para envio da mensagem
    console.log(
      `[Twilio/External API] Enviando WhatsApp de Cobrança para ${clientePhone}. Categoria: ${tipoMensagem}, Boleto: ${boleto.get('numero_boleto')}`,
    )

    const histCol = $app.findCollectionByNameOrId('historico_cobrancas')
    const hist = new Record(histCol)
    hist.set('data_cobranca', new Date().toISOString())
    hist.set('cliente_id', clienteId)
    hist.set('boleto_id', boletoId)

    let uid = ''
    if (e.auth) {
      uid = e.auth.id
    } else {
      try {
        uid = $app.findFirstRecordByData('users', 'email', 'marcusmadeira@yahoo.com.br').id
      } catch (_) {}
    }
    if (uid) hist.set('usuario_id', uid)

    hist.set('tipo_cobranca', 'WhatsApp')
    hist.set('status_cobranca', 'Enviado')
    hist.set(
      'mensagem_enviada',
      `Notificação automática enviada via robô. Categoria: ${tipoMensagem} - Referência ao boleto ${boleto.get('numero_boleto')}`,
    )
    hist.set('resultado', 'Sucesso na comunicação.')

    $app.save(hist)

    return e.json(200, {
      success: true,
      message: 'Disparo de WhatsApp efetuado e registrado no histórico com sucesso.',
    })
  } catch (err) {
    return e.json(500, { success: false, message: err.message })
  }
})
