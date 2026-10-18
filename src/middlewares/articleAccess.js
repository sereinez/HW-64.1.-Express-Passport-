import * as Article from '../models/articleModel.js';

/** Завантажує статтю за :articleId у req.article або відповідає 404. */
export function loadArticle(req, res, next) {
  const article = Article.getById(Number(req.params.articleId));
  if (!article) {
    return res.status(404).send('Статтю не знайдено.');
  }
  req.article = article;
  next();
}

/** Редагувати/видаляти статтю може лише її автор або адміністратор. */
export function canModifyArticle(req, res, next) {
  const isAuthor = req.article.authorId === req.user.id;
  if (req.user.role === 'admin' || isAuthor) return next();
  res.status(403).send('Доступ заборонено. Змінювати статтю може лише її автор або адміністратор.');
}
