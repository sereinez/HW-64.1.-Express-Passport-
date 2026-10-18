import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import * as User from '../models/userModel.js';
import { verifyPassword } from '../utils/password.js';

// Локальна стратегія: логіном є email (а не username).
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = User.getByEmail(email);
        const valid = await verifyPassword(password, user?.passwordHash);

        // Однакове повідомлення і для "немає такого email", і для "невірний пароль".
        if (!user || !valid) {
          return done(null, false, { message: 'Невірний email або пароль.' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// У сесії зберігається лише id користувача ...
passport.serializeUser((user, done) => done(null, user.id));

// ... а на кожному запиті з нього відновлюється req.user.
// Якщо користувача видалили, повертаємо false — сесія перестає діяти.
passport.deserializeUser((id, done) => done(null, User.getById(id) || false));

export default passport;
