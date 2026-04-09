routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/enviar-email',
  (e) => {
    const id = e.request.pathValue('id')
    const boleto = $app.findRecordById('boletos', id)

    boleto.set('status_boleto', 'Enviado')
    boleto.set('data_envio_cliente', new Date().toISOString())
    $app.save(boleto)

    return e.json(200, { success: true, message: 'Email enviado com sucesso' })
  },
  $apis.requireAuth(),
)
