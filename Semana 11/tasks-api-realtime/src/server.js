import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`🚀 API escuchando en http://localhost:${env.PORT}/api`);
});
