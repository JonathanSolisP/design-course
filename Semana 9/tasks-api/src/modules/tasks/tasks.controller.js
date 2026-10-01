// Traduce HTTP <-> servicio: lee req, llama al servicio y arma la respuesta. Nada más.
export function createTasksController(service) {
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
  };
}
