onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  if (!body.data_registro) {
    throw new BadRequestError('Data do registro é obrigatória.')
  }
  if (!body.regiao) {
    body.regiao = 'Maranhão'
    e.requestInfo().body = body
  }
  e.next()
}, 'precos_mercado')
