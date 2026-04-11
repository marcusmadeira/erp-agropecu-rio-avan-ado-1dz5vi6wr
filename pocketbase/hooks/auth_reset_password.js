routerAdd('POST', '/backend/v1/auth/reset-password', (e) => {
  const body = e.requestInfo().body
  const email = body.email
  const code = body.code
  const newPassword = body.newPassword

  if (!email || !code || !newPassword) {
    throw new BadRequestError('Email, código e nova senha são obrigatórios.')
  }

  try {
    const user = $app.findAuthRecordByEmail('users', email)

    const storedCode = user.get('codigo_verificacao')
    const validadeStr = user.get('validade_codigo')

    if (!storedCode || storedCode !== code) {
      throw new BadRequestError('Código inválido ou expirado')
    }

    if (validadeStr) {
      const validade = new Date(validadeStr)
      if (validade < new Date()) {
        throw new BadRequestError('Código inválido ou expirado')
      }
    }

    user.setPassword(newPassword)
    user.set('codigo_verificacao', '')
    user.set('validade_codigo', '')
    $app.saveNoValidate(user)

    return e.json(200, { message: 'Senha redefinida com sucesso! Você já pode fazer login.' })
  } catch (err) {
    if (err.message === 'sql: no rows in result set') {
      throw new NotFoundError('Usuário não encontrado.')
    }
    throw err
  }
})
