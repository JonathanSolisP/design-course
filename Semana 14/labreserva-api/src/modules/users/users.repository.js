import { db } from '../../db.js';

export const usersRepository = {
  findAll() {
    return db.prepare('SELECT * FROM users ORDER BY name').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  create({ name, email, passwordHash, role, carnet }) {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, email, password_hash, role, carnet) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, passwordHash, role, carnet ?? null);
    return db.prepare('SELECT id, name, email, role, carnet FROM users WHERE id = ?').get(lastInsertRowid);
  },

  update(user) {
    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, carnet = ?, phone = ? WHERE id = ?').run(
      user.name,
      user.email,
      user.role,
      user.carnet,
      user.phone,
      user.id,
    );
    return this.findById(user.id);
  },

  remove(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
  },
};
