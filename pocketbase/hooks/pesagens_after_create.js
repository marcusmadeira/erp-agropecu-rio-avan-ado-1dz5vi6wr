onRecordAfterCreateSuccess((e) => {
  const animalId = e.record.get('animal_id')
  const pesoKg = e.record.get('peso_kg')

  try {
    const animal = $app.findRecordById('animais', animalId)
    animal.set('peso_atual_kg', pesoKg)
    $app.save(animal)
  } catch (err) {}

  e.next()
}, 'pesagens_diarias')
