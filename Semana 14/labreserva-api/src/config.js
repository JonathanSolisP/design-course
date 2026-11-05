import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'supersecreto',
  manualsDir: path.resolve('files/manuales'),
};
