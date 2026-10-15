import { EventEmitter } from 'node:events';

// Bus de eventos en memoria: el servicio publica, los clientes SSE escuchan.
export const taskEvents = new EventEmitter();
