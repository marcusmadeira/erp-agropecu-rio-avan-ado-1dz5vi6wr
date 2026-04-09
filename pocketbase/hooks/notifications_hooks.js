onRecordAfterCreateSuccess((e) => {
  const rec = e.record
  if (rec.get('resultado_dg') === 'Prenhe') {
    try {
      const notifCol = $app.findCollectionByNameOrId('notificacoes')
      const users = $app.findRecordsByFilter('users', 'nivel_acesso = 1', '', 0, 0)
      const animal = $app.findRecordById('animais', rec.get('matriz_id'))
      for (let i = 0; i < users.length; i++) {
        const notif = new Record(notifCol)
        notif.set('usuario_id', users[i].id)
        notif.set('tipo_alerta', 'Prenhez Confirmada')
        notif.set(
          'descricao',
          `A matriz ${animal.get('id_manejo_brinco')} foi confirmada como Prenhe.`,
        )
        notif.set('lido', false)
        $app.saveNoValidate(notif)
      }
    } catch (err) {
      console.log(err.message)
    }
  }
  e.next()
}, 'manejo_iatf_curral')

onRecordAfterUpdateSuccess((e) => {
  const rec = e.record
  const qt = rec.get('quantidade_atual')
  const min = rec.get('estoque_minimo_critico') || 0
  if (qt <= min) {
    try {
      const notifCol = $app.findCollectionByNameOrId('notificacoes')
      const users = $app.findRecordsByFilter(
        'users',
        'nivel_acesso = 1 || nivel_acesso = 2',
        '',
        0,
        0,
      )
      for (let i = 0; i < users.length; i++) {
        const notif = new Record(notifCol)
        notif.set('usuario_id', users[i].id)
        notif.set('tipo_alerta', 'Estoque Crítico')
        notif.set(
          'descricao',
          `O insumo ${rec.get('produto')} atingiu nível crítico (${qt} ${rec.get('unidade_medida')}).`,
        )
        notif.set('lido', false)
        $app.saveNoValidate(notif)
      }
    } catch (err) {
      console.log(err.message)
    }
  }
  e.next()
}, 'estoque_insumos')
