export function home(req, res) {
  res.send(
    [
      'Ласкаво просимо до Express-сервера з Passport!',
      '',
      'Авторизація (Passport local: email + пароль, сесії):',
      'GET    /login, /register                (сторінки, PUG)',
      'POST   /login, /register, /logout',
      'GET    /forgot-password, POST /forgot-password',
      'GET    /reset-password/:token, POST /reset-password/:token',
      '',
      'Захищені маршрути (потрібна сесія):',
      'GET    /protected',
      'GET    /users, /users/:userId           (PUG)',
      'GET    /articles, /articles/:articleId  (EJS)',
      'POST   /users, PUT/DELETE /users/:userId',
      'POST   /articles, PUT/DELETE /articles/:articleId',
      '',
      'Налаштування (cookie): GET /theme, POST /theme',
    ].join('\n')
  );
}
