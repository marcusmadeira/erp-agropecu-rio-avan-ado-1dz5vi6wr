routerAdd('POST', '/backend/v1/auth/reset-password', (e) => {
  const body = e.requestInfo().body
  const email = body.email
  const code = body.code
  const newPassword = body.newPassword

  if (!email || !code || !newPassword) {
    throw new BadRequestError('Email, código e nova senha são obrigatórios.')
  }

  if (newPassword.length < 8) {
    throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres')
  }

  let user
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    throw new BadRequestError('Código inválido ou expirado')
  }

  const savedCode = user.getString('reset_code')
  const expiresStr = user.getString('reset_code_expires')

  if (!savedCode || savedCode !== code) {
    throw new BadRequestError('Código inválido ou expirado')
  }

  if (expiresStr) {
    const expiresAt = new Date(expiresStr)
    if (expiresAt < new Date()) {
      throw new BadRequestError('Código inválido ou expirado')
    }
  }

  user.setPassword(newPassword)
  user.set('reset_code', '')
  user.set('reset_code_expires', '')
  $app.saveNoValidate(user)

  return e.json(200, {
    message: 'Senha redefinida com sucesso! Faça login com suas novas credenciais',
  })
})
