# express-passport-app

Навчальний сервер на **Node.js + Express.js** з авторизацією через **Passport** (локальна стратегія:
**email + пароль**), сесіями **`express-session`** та відновленням пароля через email.
Сторінки генеруються шаблонізаторами **PUG** (авторизація, користувачі, `/protected`) та **EJS** (статті).
Проєкт побудований за патерном **MVC**; зберігаються favicon, перемикання теми через cookie та CSS з попередніх завдань.

## Можливості

- **Passport + `passport-local`**: вхід за email і паролем, реєстрація, вихід
- **Сесії** (`express-session`): ідентифікатор сесії лежить у cookie `sid` з прапорцями `httpOnly`, `secure`, `sameSite=lax`
- **Тривала авторизація**: сесія діє 1 добу, а з прапорцем «Запам'ятати мене» — 30 діб
- **Захищений маршрут `/protected`**: доступ лише після перевірки сесії мідлваром Passport
- Паролі зберігаються лише як **bcrypt-хеш**
- **Відновлення пароля через email** (додатково): одноразовий токен із терміном дії
- Ролі `admin` / `user`, валідація, права доступу до статей, логування, обробка помилок
- Сервер слухає порт **3000**

> **Не реалізовано (необов'язковий пункт ТЗ):** вхід через OAuth (Google, Facebook). Для нього потрібно зареєструвати
> застосунок у кабінеті провайдера й отримати Client ID / Secret. Структура проєкту дозволяє додати
> ще одну стратегію в `src/auth/passport.js` (наприклад, `passport-google-oauth20`).

## Встановлення та запуск

Потрібен Node.js 18+.

```bash
npm install
npm start
```

Режим розробки (автоперезапуск): `npm run dev`. Для Yarn: `yarn install` та `yarn start`.

Відкрийте <http://localhost:3000/login>.

> Якщо PowerShell забороняє запуск `npm` (помилка *execution policies*), виконайте один раз:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Змінні середовища (необов'язкові)

| Змінна                      | За замовчуванням              | Опис                                                                                  |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `PORT`                      | `3000`                        | Порт сервера                                                                          |
| `SESSION_SECRET`            | `dev-session-secret-change-me`| Секрет для підпису cookie сесії. **У production обов'язковий** — без нього сервер не стартує |
| `NODE_ENV`                  | —                             | `production` вмикає `trust proxy` (потрібно за reverse-proxy з HTTPS)                 |
| `COOKIE_SECURE`             | `auto`                        | `true` / `false` — примусово вмикає / вимикає прапорець `Secure`; `auto` — залежно від з'єднання |
| `APP_URL`                   | з заголовка `Host`            | Базова адреса для посилань у листах, напр. `https://example.com`                      |
| `RESET_TOKEN_TTL_MINUTES`   | `60`                          | Термін дії посилання для відновлення пароля                                           |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | —  | Налаштування SMTP. **Без `SMTP_HOST` листи не надсилаються, а виводяться в консоль сервера** |
| `MAIL_FROM`                 | `Express Passport <no-reply@example.com>` | Адреса відправника                                                |

## Тестові користувачі

| Email               | Пароль     | Роль    |
| ------------------- | ---------- | ------- |
| `admin@example.com` | `admin123` | `admin` |
| `user@example.com`  | `user123`  | `user`  |

Нових користувачів можна створити на сторінці `/register` (роль завжди `user`). Дані зберігаються в пам'яті,
тому після перезапуску сервера повертаються до початкових.

## Структура проєкту

```
express-passport-app/
├── package.json
├── README.md
├── public/                         # favicon.ico, css/style.css (світла і темна тема)
└── src/
    ├── server.js                   # запуск (порт 3000)
    ├── app.js                      # шаблонізатори, сесії, Passport, маршрути
    ├── config.js                   # налаштування сесій, cookies, токенів
    ├── auth/
    │   └── passport.js             # локальна стратегія (email + пароль), serialize/deserialize
    ├── models/                     # userModel.js, articleModel.js
    ├── controllers/                # index, auth, passwordReset, protected, theme, users, articles
    ├── routes/                     # index, auth, protected, theme, users, articles
    ├── middlewares/
    │   ├── logger.js, textResponse.js, theme.js
    │   ├── auth.js                 # ensureAuthenticated, exposeUser, requireRole, selfOrAdmin
    │   ├── validate.js             # валідація параметрів, тіла запитів і форм
    │   ├── articleAccess.js        # права доступу до статей
    │   └── errorHandler.js         # 404 і обробник помилок
    ├── utils/
    │   ├── password.js             # bcrypt
    │   ├── email.js                # нормалізація та перевірка email
    │   ├── resetToken.js           # одноразові токени відновлення пароля
    │   ├── mailer.js               # nodemailer (SMTP або вивід у консоль)
    │   └── authPage.js             # рендер сторінок авторизації, safeNext
    └── views/                      # PUG: layout, auth/*, protected, users/*; EJS: articles/*, partials/*
```

## Як це працює

### Passport: локальна стратегія (`src/auth/passport.js`)

```js
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => { ... }));
passport.serializeUser((user, done) => done(null, user.id));          // у сесії — лише id
passport.deserializeUser((id, done) => done(null, User.getById(id) || false)); // на кожному запиті -> req.user
```

- Стратегія шукає користувача за **email** і порівнює пароль із bcrypt-хешем.
- Повідомлення про помилку однакове і для «немає такого email», і для «невірний пароль»; при ненайденому
  email порівняння все одно виконується з хешем-пустушкою, щоб час відповіді не видавав існування акаунта.
- Якщо користувача видалили, `deserializeUser` повертає `false` — його сесія негайно перестає діяти.

### Сесії та cookie (`src/app.js`)

```js
session({
  name: 'sid', secret: SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, secure: COOKIE_SECURE /* 'auto' */, sameSite: 'lax', maxAge: 24h },
})
```

| Параметр               | Навіщо                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `httpOnly: true`       | JavaScript у браузері не бачить cookie — захист від крадіжки сесії через XSS                    |
| `secure`               | cookie передається лише по HTTPS. `'auto'` ставить прапорець, коли з'єднання захищене, тому на `http://localhost` розробка працює; у production за reverse-proxy `trust proxy` + HTTPS дають `Secure`. `COOKIE_SECURE=true` робить прапорець обов'язковим |
| `sameSite: 'lax'`      | cookie не надсилається з чужих сайтів у POST-запитах — базовий захист від CSRF                  |
| `saveUninitialized: false` | cookie видається лише після входу, а не кожному відвідувачу                                 |

- При вході Passport **створює нову сесію** (захист від session fixation), а при виході сесія **знищується на сервері** —
  вкрадена до виходу cookie більше не працює.
- Зберігання сесій — `MemoryStore` за замовчуванням: сесії губляться після перезапуску сервера. Для production замініть на
  Redis / базу даних (`connect-redis`, `connect-pg-simple` тощо).

### Захищений маршрут

Мідлвар `ensureAuthenticated` (`src/middlewares/auth.js`) викликає `req.isAuthenticated()` — Passport перевіряє,
що в сесії є валідний користувач. Без сесії **браузер** (`Accept: text/html`) перенаправляється на `/login?next=...`,
а **API-клієнт** (curl, Postman) отримує `401`. Мідлвар підключений до `/protected`, `/users*` та `/articles*`.

### Відновлення пароля (додатково)

1. `POST /forgot-password` — для існуючого email створюється випадковий токен (32 байти). У пам'яті зберігається лише
   **SHA-256 хеш** токена та час закінчення; токен надсилається в листі у вигляді посилання.
2. Відповідь завжди однакова (чи існує email, чи ні) — це не дає дізнатися, хто зареєстрований.
3. `GET /reset-password/:token` показує форму, якщо токен дійсний і не прострочений (за замовчуванням 60 хв).
4. `POST /reset-password/:token` зберігає новий пароль; токен **одноразовий** — повторно використати його не можна.

Без налаштованого SMTP лист виводиться в консоль сервера (рядок `[MAIL]` з посиланням) — це зручно для перевірки.

## Маршрути

**HTML** — сторінка, **текст** — `text/plain`. Дії з HTML-форм (`application/x-www-form-urlencoded`) завершуються
редіректом, а запити з `Content-Type: application/json` отримують текстову відповідь.

### Публічні

| Метод | Шлях                       | Мідлвари            | Відповіді                                                                                       |
| ----- | -------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| GET   | `/`                        | логування           | `200` текст — опис маршрутів                                                                    |
| GET   | `/favicon.ico`             | `serve-favicon`     | `200` `image/x-icon`                                                                            |
| GET   | `/login`                   | —                   | `200` HTML; якщо вже увійшли — редірект на `/protected`                                         |
| POST  | `/login`                   | `validateAuthBody`, `passport.authenticate('local')` | форма: `303` на `next` (за замовч. `/protected`) + cookie `sid`; API: `200` текст; `400` валідація; `401` невірні дані. Поля: `email`, `password`, `remember` |
| GET   | `/register`                | —                   | `200` HTML                                                                                      |
| POST  | `/register`                | `validateAuthBody`  | форма: `303` на `/protected` + cookie `sid`; API: `201`; `400`; `409` email зайнятий. Поля: `username`, `email`, `password` |
| POST  | `/logout`                  | —                   | форма: `303` на `/login`; API: `200` текст; сесія знищується, cookie `sid` видаляється          |
| GET   | `/forgot-password`         | —                   | `200` HTML — форма запиту посилання                                                             |
| POST  | `/forgot-password`         | `validateAuthBody`  | `200` однакове повідомлення для будь-якого email; `400` некоректний email                       |
| GET   | `/reset-password/:token`   | —                   | `200` HTML — форма нового пароля; `400` посилання недійсне або застаріле                        |
| POST  | `/reset-password/:token`   | `validateAuthBody`  | форма: `303` на `/login?reset=1`; API: `200`; `400` слабкий пароль або недійсний токен          |
| GET   | `/theme`                   | `readTheme`         | `200` текст — поточна тема (cookie)                                                             |
| POST  | `/theme`                   | —                   | поле `theme` = `light` / `dark`; `303` назад або `200` текст; `400` невідома тема               |

### Захищені (потрібна сесія)

| Метод  | Шлях                   | Мідлвари (після `ensureAuthenticated`)                                      | Відповіді                                                   |
| ------ | ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| GET    | `/protected`           | —                                                                           | `200` HTML (PUG) — профіль і час закінчення сесії; `401` / `302` |
| GET    | `/users`               | —                                                                           | `200` HTML (PUG); адміністратор бачить колонку Email        |
| GET    | `/users/:userId`       | `validateIdParam`                                                           | `200` HTML (PUG); email лише для адміна або власника; `400`; `404` |
| POST   | `/users`               | `requireRole('admin')`, `validateUserBody`                                  | `201`; `400`; `403`; `409`                                  |
| PUT    | `/users/:userId`       | `validateIdParam`, `selfOrAdmin`, `validateUserBody`                        | `200`; `400`; `403`; `404`; `409`                           |
| DELETE | `/users/:userId`       | `validateIdParam`, `requireRole('admin')`                                   | `200`; `400`; `403`; `404`                                  |
| GET    | `/articles`            | —                                                                           | `200` HTML (EJS)                                            |
| GET    | `/articles/:articleId` | `validateIdParam`, `loadArticle`                                            | `200` HTML (EJS); `400`; `404`                              |
| POST   | `/articles`            | `validateArticleBody`                                                       | `201`; `400`                                                |
| PUT    | `/articles/:articleId` | `validateIdParam`, `loadArticle`, `canModifyArticle`, `validateArticleBody` | `200`; `400`; `403` не автор; `404`                         |
| DELETE | `/articles/:articleId` | `validateIdParam`, `loadArticle`, `canModifyArticle`                        | `200`; `400`; `403` не автор; `404`                         |

Неіснуючий маршрут → `404`, внутрішня помилка → `500` (текст).

## Порядок мідлварів (`src/app.js`)

| №  | Мідлвар                          | Призначення                                              |
| -- | -------------------------------- | -------------------------------------------------------- |
| 1  | `serve-favicon`                  | віддає `favicon.ico`                                     |
| 2  | `logRequests`                    | логування запитів                                        |
| 3  | `express.static`                 | CSS з `public/` (до `textResponse`)                      |
| 4  | `textResponse`                   | `text/plain` за замовчуванням                            |
| 5  | `express.json` / `urlencoded`    | розбір тіла запиту                                       |
| 6  | `cookieParser`, `readTheme`      | cookies, тема оформлення                                 |
| 7  | `express-session`                | сесії                                                    |
| 8  | `passport.initialize()`, `passport.session()` | Passport і відновлення `req.user` із сесії  |
| 9  | `exposeUser`                     | `currentUser` для шаблонів                               |
| 10 | маршрути → `notFound` → `errorHandler` | обробка запитів, 404, помилки                      |

> Сесії та Passport підключаються **до** маршрутів і **після** парсерів тіла — інакше `req.body` і `req.user` будуть порожніми.

## Приклади

У браузері: <http://localhost:3000/login> → увійдіть як `admin@example.com` / `admin123` → відкриється `/protected`.
Перевірити cookie: DevTools → *Application* → *Cookies* (у `sid` має бути `HttpOnly`).

API-клієнти повинні зберігати cookie сесії (у PowerShell використовуйте `curl.exe`):

```bash
# Вхід: cookie сесії зберігається у файл cookies.txt
curl.exe -c cookies.txt -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"

# Захищений маршрут із сесією
curl.exe -b cookies.txt http://localhost:3000/protected

# Без сесії -> 401
curl.exe -i http://localhost:3000/protected

# Вихід
curl.exe -b cookies.txt -X POST http://localhost:3000/logout

# Реєстрація
curl.exe -c cookies.txt -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"username\":\"Ivan\",\"email\":\"ivan@example.com\",\"password\":\"secret12\"}"

# Відновлення пароля (посилання з'явиться в консолі сервера)
curl.exe -X POST http://localhost:3000/forgot-password -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\"}"
```

## Публікація в Git

```bash
git init
git add .
git commit -m "Add Passport local auth with sessions and password reset"
git branch -M main
git remote add origin <URL-вашого-репозиторію>
git push -u origin main
```

`node_modules/` винесено в `.gitignore`.
