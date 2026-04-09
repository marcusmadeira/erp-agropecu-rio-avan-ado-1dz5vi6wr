routerAdd(
  'POST',
  '/backend/v1/boletos/{id}/enviar-email',
  (e) => {
    // Mock email sending integration logic
    return e.json(200, { success: true, message: 'Email enviado com sucesso' })
  },
  $apis.requireAuth(),
)
