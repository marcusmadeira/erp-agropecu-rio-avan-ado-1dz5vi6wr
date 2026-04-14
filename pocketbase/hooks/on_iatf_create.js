onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const caneca_id = record.get('caneca_id')
  if (caneca_id) {
    try {
      const caneca = $app.findRecordById('canecas_semen', caneca_id)
      const doses = caneca.get('doses_atuais')
      if (doses > 0) {
        caneca.set('doses_atuais', doses - 1)
        $app.save(caneca)
      }
    } catch (_) {}
  }
  e.next()
}, 'manejo_iatf_curral')
