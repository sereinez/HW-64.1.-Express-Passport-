// Модель статей (зберігання в пам'яті).
const articles = [
  { id: 1, title: 'Вступ до Express', content: 'Express — мінімалістичний веб-фреймворк для Node.js.', authorId: 1 },
  { id: 2, title: 'Що таке мідлвари', content: 'Мідлвар — функція з доступом до req, res і next.', authorId: 2 },
];
let nextId = 3;

export const getAll = () => articles;

export const getById = id => articles.find(article => article.id === id);

export function create({ title, content, authorId }) {
  const article = { id: nextId++, title, content, authorId };
  articles.push(article);
  return article;
}

export function update(id, data) {
  const article = getById(id);
  if (!article) return undefined;
  Object.assign(article, data);
  return article;
}

export function remove(id) {
  const index = articles.findIndex(article => article.id === id);
  if (index === -1) return false;
  articles.splice(index, 1);
  return true;
}
