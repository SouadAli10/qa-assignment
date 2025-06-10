import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIGS, getCurrentBackend } from '@/lib/api-config';
import type { ApiBackend } from '@/lib/api-config';
import type { Todo, CreateTodoDto, UpdateTodoDto } from '@/types/todo';

class TodoApiService {
  private axiosInstance: AxiosInstance;
  private backend: ApiBackend;

  constructor() {
    this.backend = getCurrentBackend();
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const config = API_CONFIGS[this.backend];
    return axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  // Switch backend and recreate axios instance
  switchBackend(backend: ApiBackend) {
    this.backend = backend;
    this.axiosInstance = this.createAxiosInstance();
  }

  // Get current backend
  getCurrentBackend(): ApiBackend {
    return this.backend;
  }

  // Todo CRUD operations
  async getAllTodos(): Promise<Todo[]> {
    const response = await this.axiosInstance.get<any>('/todos');
    if (response.data && Array.isArray(response.data.data)) {
      // Handle paginated response from either Go or Node.js
      return response.data.data;
    }
    // Handle simple array response (fallback)
    return response.data;
  }

  async getTodoById(id: number): Promise<Todo> {
    const response = await this.axiosInstance.get<Todo>(`/todos/${id}`);
    return response.data;
  }

  async createTodo(todo: CreateTodoDto): Promise<Todo> {
    const response = await this.axiosInstance.post<Todo>('/todos', todo);
    return response.data;
  }

  async updateTodo(id: number, todo: UpdateTodoDto): Promise<Todo> {
    const response = await this.axiosInstance.put<Todo>(`/todos/${id}`, todo);
    return response.data;
  }

  async deleteTodo(id: number): Promise<void> {
    await this.axiosInstance.delete(`/todos/${id}`);
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const healthUrl = this.axiosInstance.defaults.baseURL?.replace('/api', '') + '/health';
      await axios.get(healthUrl);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a singleton instance
export const todoApi = new TodoApiService();