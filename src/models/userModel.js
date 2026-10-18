import bcrypt from 'bcryptjs';

// Модель користувачів (зберігання в пам'яті).
// Паролі — лише bcrypt-хеші. Для відновлення пароля зберігається хеш токена та термін його дії.
const users = [
  { id: 1, username: 'admin', email: 'admin@example.com', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { id: 2, username: 'user', email: 'user@example.com', passwordHash: bcrypt.hashSync('user123', 10), role: 'user' },
];
let nextId = 3;

const normalize = email => String(email ?? '').trim().toLowerCase();

export const getAll = () => users;

export const getById = id => users.find(user => user.id === id);

export const getByEmail = email => users.find(user => user.email === normalize(email));

export const getByResetTokenHash = hash =>
  users.find(user => user.resetTokenHash === hash && user.resetExpires > Date.now());

export function create({ username, email, passwordHash, role = 'user' }) {
  const user = { id: nextId++, username, email: normalize(email), passwordHash, role };
  users.push(user);
  return user;
}

export function update(id, data) {
  const user = getById(id);
  if (!user) return undefined;
  Object.assign(user, data);
  return user;
}

export function remove(id) {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}
