routerAdd('POST', '/backend/v1/auth/verify-code', (e) => {
  const body = e.requestInfo().body
  const email = body.email
  const code = body.code

  if (!email || !code) {
    throw new BadRequestError('Email e código são obrigatórios.')
  }

  try {
    const user = $app.findAuthRecordByEmail('users', email)

    if (user.get('verified')) {
      return e.json(200, { message: 'Usuário já verificado.' })
    }

    const storedCode = user.get('codigo_verificacao')
    const validadeStr = user.get('validade_codigo')

    if (!storedCode || storedCode !== code) {
      throw new BadRequestError('Código inválido.')
    }

    if (validadeStr) {
      const validade = new Date(validadeStr)
      if (validade < new Date()) {
        throw new BadRequestError('Código expirado.')
      }
    }

    user.setVerified(true)
    user.set('codigo_verificacao', '')
    user.set('validade_codigo', '')
    $app.saveNoValidate(user)

    return e.json(200, { message: 'Email verificado com sucesso.' })
  } catch (err) {
    if (err.message === 'sql: no rows in result set') {
      throw new NotFoundError('Usuário não encontrado.')
    }
    throw err
  }
})
