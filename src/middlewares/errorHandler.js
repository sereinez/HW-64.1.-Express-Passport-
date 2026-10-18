// 404 для неіснуючих маршрутів.
export function notFound(req, res, next) {
  const error = new Error(`Маршрут ${req.method} ${req.originalUrl} не знайдено.`);
  error.status = 404;
  next(error);
}

// Глобальний обробник помилок (4 параметри — так Express розпізнає error-мідлвар).
// Підключається ОСТАННІМ.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Некоректний JSON у тілі запиту.';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Внутрішня помилка сервера.';
  }

  res.status(status).type('text/plain').send(message);
}
