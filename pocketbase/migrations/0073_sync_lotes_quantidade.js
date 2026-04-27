migrate(
  (app) => {
    const lotes = app.findRecordsByFilter('lotes', '1=1', '', 10000, 0)
    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i]
      let count = 0
      try {
        const animais = app.findRecordsByFilter(
          'animais',
          "lote_atual_id = '" + lote.id + "'",
          '',
          10000,
          0,
        )
        count = animais.length
      } catch (_) {
        count = 0
      }
      lote.set('quantidade_cabecas', count)
      app.saveNoValidate(lote)
    }
  },
  (app) => {},
)
