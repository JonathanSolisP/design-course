import { Router } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { usersRepository } from '../users/users.repository.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const { name, email, password, carnet } = req.body;
  if (!name || !email || !password) throw new HttpError(400, 'Nombre, email y contraseña son obligatorios');
  if (usersRepository.findByEmail(email)) throw new HttpError(409, 'El email ya está registrado');

  const user = usersRepository.create({
    name,
    email,
    carnet,
    passwordHash: hashPassword(password),
    role: 'estudiante',
  });
  res.status(201).json(user);
});

authRouter.post('/login', (req, res) => {
  console.log('Intento de login:', req.body);
  const { email, password } = req.body;

  const user = usersRepository.findByEmail(email);
  if (!user) throw new HttpError(404, 'No existe un usuario con ese email');
  if (!verifyPassword(password, user.password_hash)) throw new HttpError(401, 'Contraseña incorrecta');

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
});
