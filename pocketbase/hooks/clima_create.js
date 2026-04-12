onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  if (!body.data_chuva || body.quantidade_mm == null) {
    throw new BadRequestError('Data e quantidade são obrigatórios.')
  }
  if (body.quantidade_mm < 0) {
    throw new BadRequestError('Quantidade de chuva não pode ser negativa.')
  }
  e.next()
}, 'registro_chuvas')

onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body
  if (body.quantidade_mm != null && body.quantidade_mm < 0) {
    throw new BadRequestError('Quantidade de chuva não pode ser negativa.')
  }
  e.next()
}, 'registro_chuvas')
