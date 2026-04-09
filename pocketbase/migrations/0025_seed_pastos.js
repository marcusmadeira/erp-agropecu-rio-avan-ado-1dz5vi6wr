migrate(
  (app) => {
    const pastosCol = app.findCollectionByNameOrId('pastos_e_piquetes')
    const seed = [
      { nome: 'Piquete 01 - Maternidade', capacidade: 50 },
      { nome: 'Piquete 02 - Engorda', capacidade: 100 },
      { nome: 'Piquete 03 - Recria', capacidade: 80 },
    ]

    for (const s of seed) {
      try {
        app.findFirstRecordByData('pastos_e_piquetes', 'nome', s.nome)
      } catch (_) {
        const record = new Record(pastosCol)
        record.set('nome', s.nome)
        record.set('capacidade', s.capacidade)
        app.save(record)
      }
    }
  },
  (app) => {
    // no-op
  },
)
