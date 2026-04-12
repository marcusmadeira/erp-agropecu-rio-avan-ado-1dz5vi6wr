routerAdd('POST', '/backend/v1/autenticar_usuario', (e) => {
  const body = e.requestInfo().body
  const url = $secrets.get('PB_INSTANCE_URL') + '/api/collections/users/auth-with-password'

  try {
    const res = $http.send({
      url: url,
      method: 'POST',
      body: JSON.stringify({ identity: body.login || body.email, password: body.password }),
      headers: { 'Content-Type': 'application/json' },
      timeout: 15,
    })

    if (res.statusCode >= 400) {
      throw new BadRequestError('Usuário ou senha inválidos')
    }

    return e.json(res.statusCode, res.json)
  } catch (err) {
    throw new BadRequestError('Usuário ou senha inválidos')
  }
})
