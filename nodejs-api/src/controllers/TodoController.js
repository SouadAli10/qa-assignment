import { TodoService } from '../services/TodoService.js';
import { asyncHandler } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TodoController');

export class TodoController {
  constructor(todoService = null) {
    this.todoService = todoService || new TodoService();
  }

  // Get all todos
  getTodos = asyncHandler(async (request, reply) => {
    const result = await this.todoService.getTodos(request.query);
    return reply.send(result);
  });

  // Get todo by ID
  getTodo = asyncHandler(async (request, reply) => {
    const { id } = request.params;
    const todo = await this.todoService.getTodoById(id);
    return reply.send(todo);
  });

  // Create new todo
  createTodo = asyncHandler(async (request, reply) => {
    const todo = await this.todoService.createTodo(request.body);
    return reply.status(201).send(todo);
  });

  // Update todo
  updateTodo = asyncHandler(async (request, reply) => {
    const { id } = request.params;
    const todo = await this.todoService.updateTodo(id, request.body);
    return reply.send(todo);
  });

  // Delete todo
  deleteTodo = asyncHandler(async (request, reply) => {
    const { id } = request.params;
    await this.todoService.deleteTodo(id);
    return reply.status(204).send();
  });

  // Get todo statistics
  getTodoStats = asyncHandler(async (request, reply) => {
    const stats = await this.todoService.getTodoStats();
    return reply.send(stats);
  });

  // Toggle completion
  toggleCompletion = asyncHandler(async (request, reply) => {
    const { id } = request.params;
    const todo = await this.todoService.toggleTodoCompletion(id);
    return reply.send(todo);
  });
}

export default TodoController;