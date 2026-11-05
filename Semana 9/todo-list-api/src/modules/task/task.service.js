export function createTaskService(taskRepository) {
    return {
        list: () => taskRepository.findAll(),
        create: (data) => taskRepository.create(data),
    };
}
