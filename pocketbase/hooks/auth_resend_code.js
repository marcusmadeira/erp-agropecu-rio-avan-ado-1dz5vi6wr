routerAdd('POST', '/backend/v1/auth/resend-code', (e) => {
  const body = e.requestInfo().body
  const email = body.email

  if (!email) {
    throw new BadRequestError('Email é obrigatório.')
  }

  try {
    const user = $app.findAuthRecordByEmail('users', email)

    if (user.get('verified')) {
      return e.json(200, { message: 'Usuário já verificado.' })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const validade = new Date()
    validade.setMinutes(validade.getMinutes() + 15)

    user.set('codigo_verificacao', code)
    user.set('validade_codigo', validade.toISOString())
    $app.saveNoValidate(user)

    // Na integração real, chamar o serviço de email (e.g. Resend) aqui.
    console.log(`[RESEND CODE] Email: ${email}, Code: ${code}`)

    return e.json(200, { message: 'Código reenviado.' })
  } catch (err) {
    if (err.message === 'sql: no rows in result set') {
      // Retorna sucesso para evitar enumeração de emails
      return e.json(200, { message: 'Se o email existir, um código foi enviado.' })
    }
    throw err
  }
})
