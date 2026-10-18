// У шаблони передаємо лише безпечні поля (без хешу пароля).
export const publicUser = ({ id, username, email, role }) => ({ id, username, email, role });

/** Робить поточного користувача (якщо є) доступним у шаблонах як currentUser. */
export function exposeUser(req, res, next) {
  res.locals.currentUser = req.user ? publicUser(req.user) : null;
  next();
}

/** Браузер явно просить HTML-сторінку (а не curl/Postman). */
const wantsPage = req => (req.headers.accept || '').includes('text/html');

/**
 * Мідлвар для захищених маршрутів. Passport сам перевіряє сесію
 * (req.isAuthenticated() істинний лише коли в сесії є валідний користувач).
 * Браузер перенаправляється на /login, API-клієнт отримує 401.
 */
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();

  if (wantsPage(req)) {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  res.status(401).send('Доступ заборонено. Увійдіть через POST /login (сесійна cookie sid).');
}

/** Дозволяє доступ лише користувачам із вказаною роллю. */
export const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send(`Доступ заборонено. Потрібна роль: ${role}.`);
  }
  next();
};

/** Дозволяє доступ адміністратору або самому користувачу (за :param). */
export const selfOrAdmin = paramName => (req, res, next) => {
  const isSelf = req.user.id === Number(req.params[paramName]);
  if (req.user.role === 'admin' || isSelf) return next();
  res.status(403).send('Доступ заборонено. Можна змінювати лише власний профіль.');
};
