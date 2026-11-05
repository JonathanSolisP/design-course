import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './lib/password.js';

// Base de datos en memoria: se crea de nuevo cada vez que arranca la API.
export const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'estudiante',
    carnet        TEXT,
    phone         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE labs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    building    TEXT NOT NULL,
    capacity    INTEGER NOT NULL,
    description TEXT
  );

  CREATE TABLE reservations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id     INTEGER NOT NULL REFERENCES labs(id),
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       TEXT NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour   INTEGER NOT NULL,
    purpose    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id     INTEGER NOT NULL REFERENCES labs(id),
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertUser = db.prepare(
  'INSERT INTO users (name, email, password_hash, role, carnet, phone) VALUES (?, ?, ?, ?, ?, ?)',
);
insertUser.run('Laura Méndez', 'admin@labreserva.test', hashPassword('admin123'), 'admin', null, '8000-0001');
insertUser.run('Marco Rojas', 'mrojas@labreserva.test', hashPassword('profe2026'), 'profesor', null, '8000-0002');
insertUser.run('Ana Vargas', 'ana@labreserva.test', hashPassword('ana12345'), 'estudiante', '2023101234', '8000-0003');
insertUser.run('Beto Quesada', 'beto@labreserva.test', hashPassword('qwerty'), 'estudiante', '2023105678', '8000-0004');

const insertLab = db.prepare('INSERT INTO labs (name, building, capacity, description) VALUES (?, ?, ?, ?)');
insertLab.run('Laboratorio de Redes', 'Edificio B', 20, 'Routers, switches y racks para prácticas de redes.');
insertLab.run('Laboratorio de Sistemas Embebidos', 'Edificio B', 16, 'Microcontroladores, osciloscopios y fuentes.');
insertLab.run('Laboratorio de Cómputo 1', 'Edificio A', 30, 'Computadoras de escritorio con software del curso.');

const insertReservation = db.prepare(
  'INSERT INTO reservations (lab_id, user_id, date, start_hour, end_hour, purpose) VALUES (?, ?, ?, ?, ?, ?)',
);
insertReservation.run(1, 4, '2026-11-16', 8, 10, 'Práctica de VLANs para Redes II');
insertReservation.run(2, 3, '2026-11-17', 13, 15, 'Proyecto final: estación meteorológica');
insertReservation.run(3, 2, '2026-11-18', 9, 12, 'Examen parcial de Programación');

const insertComment = db.prepare('INSERT INTO comments (lab_id, user_id, body) VALUES (?, ?, ?)');
insertComment.run(1, 4, 'El switch del rack 3 no enciende.');
insertComment.run(2, 2, 'Recuerden devolver los cables al terminar.');
