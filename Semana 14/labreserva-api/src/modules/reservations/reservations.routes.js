import { Router } from 'express';
import { HttpError } from '../../utils/http-error.js';
import { requireAuth } from '../../middlewares/auth.js';
import { labsRepository } from '../labs/labs.repository.js';
import { reservationsRepository } from './reservations.repository.js';

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

// Mis reservas
reservationsRouter.get('/', (req, res) => {
  res.json(reservationsRepository.findByUser(req.user.id));
});

reservationsRouter.get('/:id', (req, res) => {
  const reservation = reservationsRepository.findById(req.params.id);
  if (!reservation) throw new HttpError(404, 'Reserva no encontrada');
  res.json(reservation);
});

reservationsRouter.post('/', (req, res) => {
  const { labId, date, startHour, endHour, purpose } = req.body;
  if (!labId || !date || startHour == null || endHour == null || !purpose) {
    throw new HttpError(400, 'labId, date, startHour, endHour y purpose son obligatorios');
  }
  if (!labsRepository.findById(labId)) throw new HttpError(404, 'Laboratorio no encontrado');
  if (startHour >= endHour) throw new HttpError(400, 'La hora de inicio debe ser menor que la de fin');
  if (reservationsRepository.findOverlapping(labId, date, startHour, endHour)) {
    throw new HttpError(409, 'El laboratorio ya está reservado en ese horario');
  }

  const reservation = reservationsRepository.create({
    labId,
    userId: req.user.id,
    date,
    startHour,
    endHour,
    purpose,
  });
  res.status(201).json(reservation);
});

reservationsRouter.delete('/:id', (req, res) => {
  if (!reservationsRepository.remove(req.params.id)) throw new HttpError(404, 'Reserva no encontrada');
  res.status(204).end();
});
