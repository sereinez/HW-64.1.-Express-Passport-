import * as User from '../models/userModel.js';
import * as Article from '../models/articleModel.js';
import { hashPassword } from '../utils/password.js';
import { normalizeEmail } from '../utils/email.js';

// Текстовий формат — для POST/PUT/DELETE (відповіді сервера залишаються текстовими).
const format = user => `#${user.id} ${user.username} <${user.email}> (${user.role})`;

// У шаблони не передаємо хеш пароля. Email бачить лише адміністратор або сам користувач.
const toView = (user, viewer) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  email: viewer && (viewer.role === 'admin' || viewer.id === user.id) ? user.email : null,
});

/** GET /users — сторінка зі списком користувачів (PUG). */
export function list(req, res) {
  res.type('html').render('users/list.pug', {
    title: 'Користувачі',
    section: 'users',
    users: User.getAll().map(user => toView(user, req.user)),
  });
}

/** GET /users/:userId — сторінка з деталями користувача (PUG). */
export function getOne(req, res) {
  const user = User.getById(Number(req.params.userId));
  if (!user) return res.status(404).send('Користувача не знайдено.');

  res.type('html').render('users/details.pug', {
    title: user.username,
    section: 'users',
    person: toView(user, req.user),
    articles: Article.getAll().filter(article => article.authorId === user.id),
  });
}

export async function create(req, res, next) {
  try {
    const { username, password, role } = req.body;
    const email = normalizeEmail(req.body.email);

    if (User.getByEmail(email)) {
      return res.status(409).send('Користувач із таким email вже існує.');
    }

    const user = User.create({
      username: username.trim(),
      email,
      passwordHash: await hashPassword(password),
      role,
    });
    res.status(201).send(`Користувача створено: ${format(user)}`);
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.userId);
    const existing = User.getById(id);
    if (!existing) return res.status(404).send('Користувача не знайдено.');

    const { username, password, role } = req.body;
    const email = normalizeEmail(req.body.email);

    const taken = User.getByEmail(email);
    if (taken && taken.id !== id) {
      return res.status(409).send('Користувач із таким email вже існує.');
    }

    // Звичайний користувач не може підвищити собі роль.
    const newRole = req.user.role === 'admin' ? (role ?? existing.role) : existing.role;

    const user = User.update(id, {
      username: username.trim(),
      email,
      passwordHash: await hashPassword(password),
      role: newRole,
    });
    res.send(`Користувача оновлено: ${format(user)}`);
  } catch (error) {
    next(error);
  }
}

export function remove(req, res) {
  const id = Number(req.params.userId);
  if (!User.remove(id)) return res.status(404).send('Користувача не знайдено.');
  res.send(`Користувача #${id} видалено.`);
}
