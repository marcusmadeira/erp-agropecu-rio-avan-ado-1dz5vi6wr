migrate(
  (app) => {
    const users = app.findRecordsByFilter('users', 'verified = false', '', 10000, 0)
    for (let user of users) {
      user.setVerified(true)
      app.saveNoValidate(user)
    }
  },
  (app) => {
    // Reverting would mean un-verifying, which is not reliable without state tracking.
  },
)
