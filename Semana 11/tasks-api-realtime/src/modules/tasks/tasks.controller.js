// Traduce HTTP <-> servicio: lee req, llama al servicio y arma la respuesta. Nada más.
export function createTasksController(service, events) {
  return {
    async list(_req, res) {
      res.json(await service.list());
    },

    async getById(req, res) {
      res.json(await service.getById(req.params.id));
    },

    async create(req, res) {
      res.status(201).json(await service.create(req.body));
    },

    async update(req, res) {
      res.json(await service.update(req.params.id, req.body));
    },

    async remove(req, res) {
      await service.remove(req.params.id);
      res.status(204).end();
    },

    stream(req, res) {
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();

      // Formato SSE: "data: <json>" seguido de una línea en blanco.
      const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
      events.on('change', send);
      // Al cerrar la pestaña quitamos el listener (si no, fuga de memoria).
      req.on('close', () => events.off('change', send));
    },
  };
}
