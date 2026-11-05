export function createTaskController(taskService) {
    return {
        async list(req, res) {
            const tasks = await taskService.list();
            res.json(tasks);
        },

        async create(req, res) {
            res.status(201).json(await taskService.create(req.body));
        }
    };
}
