import { createHash } from 'node:crypto';

// Nunca guardamos la contraseña en texto plano: solo su hash.
export function hashPassword(password) {
  return createHash('md5').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
