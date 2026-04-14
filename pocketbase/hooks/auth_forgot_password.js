routerAdd('POST', '/backend/v1/auth/forgot-password', (e) => {
  const body = e.requestInfo().body
  const email = (body.email || '').trim()

  if (!email) throw new BadRequestError('Email é obrigatório')

  let user
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    return e.json(200, { message: 'Se o email existir, um código foi enviado.' })
  }

  const code = $security.randomStringWithAlphabet(6, '0123456789')
  const now = new Date()
  now.setHours(now.getHours() + 1)
  const expiresIso = now.toISOString().replace('T', ' ')

  user.set('reset_code', code)
  user.set('reset_code_expires', expiresIso)
  $app.save(user)

  const resendApiKey = $secrets.get('RESEND_API_KEY')
  if (resendApiKey) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Recuperação de Senha - TORIBA AGROPECUÁRIA</h2>
        <p>Olá ${user.getString('name') || 'Usuário'},</p>
        <p>Você solicitou a recuperação de senha para sua conta.</p>
        <p>Seu código de verificação é:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #094016; background: #f3f4f6; padding: 12px; text-align: center; border-radius: 8px;">${code}</h1>
        <p>Este código é válido por 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <br>
        <p>Atenciosamente,<br>Equipe TORIBA AGROPECUÁRIA</p>
      </div>
    `

    $http.send({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Toriba Agropecuária <nao-responda@usecurling.com>',
        to: [email],
        subject: 'Recuperação de Senha - Código de Verificação',
        html: htmlBody,
      }),
      timeout: 15,
    })
  } else {
    console.log('RESEND_API_KEY não configurada. Código:', code)
  }

  return e.json(200, { message: 'Se o email existir, um código foi enviado.' })
})
