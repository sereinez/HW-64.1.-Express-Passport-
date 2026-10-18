import * as Article from '../models/articleModel.js';
import * as User from '../models/userModel.js';

// Текстовий формат — для POST/PUT/DELETE (відповіді сервера залишаються текстовими).
const format = article =>
  `#${article.id} "${article.title}" (автор: #${article.authorId})\n${article.content}`;

const EXCERPT_LENGTH = 120;

/** Готує статтю для шаблону: додає ім'я автора та короткий уривок. */
function toView(article) {
  const author = User.getById(article.authorId);
  const excerpt =
    article.content.length > EXCERPT_LENGTH
      ? `${article.content.slice(0, EXCERPT_LENGTH).trimEnd()}…`
      : article.content;

  return {
    id: article.id,
    title: article.title,
    content: article.content,
    excerpt,
    authorId: author ? author.id : null,
    authorName: author ? author.username : 'невідомий автор',
  };
}

/** GET /articles — сторінка зі списком статей (EJS). */
export function list(req, res) {
  res.type('html').render('articles/list.ejs', {
    title: 'Статті',
    section: 'articles',
    articles: Article.getAll().map(toView),
  });
}

/** GET /articles/:articleId — сторінка з деталями статті (EJS). */
export function getOne(req, res) {
  // req.article вже завантажено мідлваром loadArticle
  res.type('html').render('articles/details.ejs', {
    title: req.article.title,
    section: 'articles',
    article: toView(req.article),
  });
}

export function create(req, res) {
  const { title, content } = req.body;
  const article = Article.create({
    title: title.trim(),
    content,
    authorId: req.user.id,
  });
  res.status(201).send(`Статтю створено:\n${format(article)}`);
}

export function update(req, res) {
  const { title, content } = req.body;
  const article = Article.update(req.article.id, { title: title.trim(), content });
  res.send(`Статтю оновлено:\n${format(article)}`);
}

export function remove(req, res) {
  Article.remove(req.article.id);
  res.send(`Статтю #${req.article.id} видалено.`);
}
