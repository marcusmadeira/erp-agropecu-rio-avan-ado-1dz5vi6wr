routerAdd('POST', '/backend/v1/autenticar_usuario', (e) => {
  const body = e.requestInfo().body
  const identity = (body.login || body.email || '').trim()
  const password = body.password || ''

  try {
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
      throw new BadRequestError('Email não encontrado')
    }

    const user = $app.findRecordById('users', userId)

    if (!user.validatePassword(password)) {
      throw new BadRequestError('Senha incorreta')
    }

    return $apis.recordAuthResponse($app, e, user)
  } catch (err) {
    if (err.message === 'Email não encontrado' || err.message === 'Senha incorreta') {
      throw new BadRequestError(err.message)
    }
    throw new BadRequestError('Usuário ou senha inválidos')
  }
})
