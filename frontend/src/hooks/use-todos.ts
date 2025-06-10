import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/services/todo-api';
import type { CreateTodoDto, UpdateTodoDto } from '@/types/todo';
import { toast } from 'sonner';

const TODOS_QUERY_KEY = ['todos'];

// Fetch all todos
export const useTodos = () => {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: () => todoApi.getAllTodos(),
    staleTime: 5000,
  });
};

// Create todo mutation
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo: CreateTodoDto) => todoApi.createTodo(todo),
    onSuccess: () => {
      toast.success('Todo created successfully!');
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error('Failed to create todo', {
        description: error.message,
      });
    }
  });
};

// Update todo mutation
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, todo }: { id: number; todo: UpdateTodoDto }) =>
      todoApi.updateTodo(id, todo),
    onSuccess: () => {
      toast.success('Todo updated successfully!');
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error('Failed to update todo', {
        description: error.message,
      });
    }
  });
};

// Delete todo mutation
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => todoApi.deleteTodo(id),
    onSuccess: () => {
      toast.success('Todo deleted successfully!');
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error('Failed to delete todo', {
        description: error.message,
      });
    }
  });
};

// Check API health
export const useApiHealth = () => {
  return useQuery({
    queryKey: ['health', todoApi.getCurrentBackend()],
    queryFn: () => todoApi.checkHealth(),
    retry: false,
    refetchInterval: 30000, // Check every 30 seconds
  });
};