/// <reference types="vitest/globals" />
/// <reference types="jest-dom" />

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TodoList } from './TodoList';
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/use-todos');

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('TodoList', () => {
  beforeEach(() => {
    (useCreateTodo as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useUpdateTodo as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useDeleteTodo as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });
  it('should render a loading state', () => {
    (useTodos as vi.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<TodoList />, { wrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render an error state', () => {
    (useTodos as vi.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<TodoList />, { wrapper });

    expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
  });

  it('should render a list of todos', () => {
    (useTodos as vi.Mock).mockReturnValue({
      data: [
        { id: 1, title: 'Test Todo 1', completed: false },
        { id: 2, title: 'Test Todo 2', completed: true },
      ],
      isLoading: false,
      error: null,
    });

    render(<TodoList />, { wrapper });

    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
  });
}); 