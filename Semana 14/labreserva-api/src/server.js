import { config } from './config.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(config.port, (error) => {
  if (error) throw error;
  console.log(`LabReserva escuchando en http://localhost:${config.port}`);
});
