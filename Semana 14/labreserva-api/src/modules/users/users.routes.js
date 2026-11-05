import { Router } from 'express';
import _ from 'lodash';
import { requireAuth } from '../../middlewares/auth.js';
import { usersRepository } from './users.repository.js';

const withoutHash = ({ password_hash, ...user }) => user;

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Directorio: los profesores lo usan para buscar a los estudiantes de su grupo.
usersRouter.get('/', (_req, res) => {
  res.json(usersRepository.findAll());
});

usersRouter.get('/me', (req, res) => {
  res.json(withoutHash(usersRepository.findById(req.user.id)));
});

// Actualizar el perfil propio (nombre, teléfono, carnet...).
usersRouter.patch('/me', (req, res) => {
  const user = usersRepository.findById(req.user.id);
  const updated = usersRepository.update(_.merge(user, req.body));
  res.json(withoutHash(updated));
});
