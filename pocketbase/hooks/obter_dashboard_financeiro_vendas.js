routerAdd(
  'GET',
  '/backend/v1/obter_dashboard_financeiro_vendas',
  (e) => {
    let realizedRevenue = 0
    let pendingRevenue = 0
    let delinquency = 0

    // Realized Revenue
    const recebimentos = $app.findRecordsByFilter('recebimentos_vendas', '1=1', '', 0, 0)
    for (let r of recebimentos) {
      realizedRevenue += r.get('valor_recebido') || 0
    }

    // Pending & Delinquency
    const todayStr = new Date().toISOString().split('T')[0]
    const parcelas = $app.findRecordsByFilter(
      'parcelas_venda',
      'status_parcela = "Pendente" || status_parcela = "Atrasada"',
      '',
      0,
      0,
    )
    for (let p of parcelas) {
      const st = p.get('status_parcela')
      const vDateStr = p.get('data_vencimento').toString().split(' ')[0]
      const val = p.get('valor_parcela') || 0

      if (st === 'Atrasada' || (st === 'Pendente' && vDateStr < todayStr)) {
        delinquency += val
      } else if (st === 'Pendente') {
        pendingRevenue += val
      }
    }

    return e.json(200, {
      realizedRevenue,
      pendingRevenue,
      delinquency,
    })
  },
  $apis.requireAuth(),
)
