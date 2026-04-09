routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/send-email',
  (e) => {
    return e.json(200, { success: true, message: 'Email enviado com sucesso' })
  },
  $apis.requireAuth(),
)
