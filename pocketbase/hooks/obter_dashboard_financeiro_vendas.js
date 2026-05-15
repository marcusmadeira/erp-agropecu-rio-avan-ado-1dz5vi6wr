routerAdd(
  'GET',
  '/backend/v1/obter_dashboard_financeiro_vendas',
  (e) => {
    let recebido = 0
    let aReceber = 0
    let vencido = 0
    let proximos7Dias = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const sevenDays = new Date(today)
    sevenDays.setDate(sevenDays.getDate() + 7)
    const sevenDaysStr = sevenDays.toISOString().split('T')[0]

    const parcelas = $app.findRecordsByFilter(
      'parcelas_venda',
      "status_parcela != 'Cancelada'",
      '',
      0,
      0,
    )
    for (let p of parcelas) {
      const st = p.get('status_parcela')
      const val = p.get('valor_parcela') || 0

      if (st === 'Paga') {
        recebido += val
      } else if (st === 'Pendente' || st === 'Atrasada') {
        const vDateStr = p.get('data_vencimento').toString().split(' ')[0]

        if (vDateStr < todayStr || st === 'Atrasada') {
          vencido += val
        } else {
          aReceber += val
          if (vDateStr >= todayStr && vDateStr <= sevenDaysStr) {
            proximos7Dias += val
          }
        }
      }
    }

    return e.json(200, {
      recebido,
      aReceber,
      vencido,
      proximos7Dias,
    })
  },
  $apis.requireAuth(),
)
