onRecordAfterCreateSuccess((e) => {
  const user = e.record

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const validade = new Date()
  validade.setMinutes(validade.getMinutes() + 15)

  user.set('codigo_verificacao', code)
  user.set('validade_codigo', validade.toISOString())
  $app.saveNoValidate(user)

  // Na integração real, chamar o serviço de email (e.g. Resend) aqui.
  console.log(`[REGISTER CODE] Email: ${user.get('email')}, Code: ${code}`)

  e.next()
}, 'users')
