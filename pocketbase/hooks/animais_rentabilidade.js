routerAdd(
  'GET',
  '/backend/v1/animais/{id}/rentabilidade',
  (e) => {
    const id = e.request.pathValue('id')
    const animal = $app.findRecordById('animais', id)

    const custo = animal.get('custo_variavel_acumulado') || 0
    const peso = animal.get('peso_atual_kg') || 0

    let precoArroba = 250
    try {
      const precoRecord = $app.findFirstRecordByFilter('precos_mercado', '1=1', '-data_registro')
      if (precoRecord && precoRecord.get('preco_arroba')) {
        precoArroba = precoRecord.get('preco_arroba')
      }
    } catch (err) {}

    const arrobas = peso / 30
    const receita = arrobas * precoArroba
    const lucro = receita - custo
    const roi = custo > 0 ? (lucro / custo) * 100 : 0

    return e.json(200, {
      custo_total: custo,
      receita_estimada: receita,
      lucro: lucro,
      roi: roi,
      preco_arroba: precoArroba,
      peso_atual_kg: peso,
    })
  },
  $apis.requireAuth(),
)
