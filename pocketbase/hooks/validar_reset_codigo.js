routerAdd('POST', '/backend/v1/validar_reset_codigo', (e) => {
  const body = e.requestInfo().body
  const identity = (body.login || body.email || '').trim()
  const code = (body.code || '').trim()
  const newPassword = body.new_password || ''

  if (!identity || !code || !newPassword) {
    throw new BadRequestError('Dados incompletos. Informe login/email, código e nova senha.')
  }

  if (newPassword.length < 8) {
    throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres')
  }

  let userId = ''
  try {
    const result = new DynamicModel({ id: '' })
    $app
      .db()
      .newQuery(
        'SELECT id FROM users WHERE LOWER(email) = LOWER({:identity}) OR LOWER(login) = LOWER({:identity}) LIMIT 1',
      )
      .bind({ identity })
      .one(result)
    userId = result.id
  } catch (_) {
    throw new BadRequestError('Email ou login não encontrado')
  }

  const user = $app.findRecordById('users', userId)

  const savedCode = user.getString('reset_code')
  const expiresStr = user.getString('reset_code_expires')

  if (!savedCode || savedCode !== code) {
    throw new BadRequestError('Código de verificação inválido')
  }

  if (!expiresStr) {
    throw new BadRequestError('Código expirado')
  }

  const expiresAt = new Date(expiresStr)
  if (expiresAt < new Date()) {
    throw new BadRequestError('Código de verificação expirado')
  }

  // Valid, reset password
  user.setPassword(newPassword)
  user.set('reset_code', '')
  user.set('reset_code_expires', '')

  $app.save(user)

  return e.json(200, { message: 'Senha atualizada com sucesso' })
})
