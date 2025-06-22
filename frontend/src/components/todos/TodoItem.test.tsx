/// <reference types="vitest/globals" />
/// <reference types="jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoItem } from './TodoItem';
import type { Todo } from '@/types/todo';

vi.mock('@/hooks/use-todos');

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockOnEdit = vi.fn();
const mockTodo: Todo = {
  id: 1,
  title: 'Test Todo',
  description: 'Test Description',
  completed: false,
  created_at: '2023-01-01T00:00:00Z',
};

describe('TodoItem', () => {
  beforeEach(() => {
    (useUpdateTodo as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    (useDeleteTodo as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  })

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { case: 'with description', todo: mockTodo },
    { case: 'without description', todo: { ...mockTodo, description: undefined } },
    {
      case: 'without created at date', todo: {
        id: 1,
        title: 'Test Todo',
        completed: false,
      }
    }
  ])('renders todo item correctly - $case', ({ todo }) => {
    render(<TodoItem todo={todo} onEdit={mockOnEdit} />, { wrapper });

    expect(screen.getByText(todo.title)).toBeInTheDocument();

    if (todo.description) {
      expect(screen.getByText(todo.description)).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId('todo-description')).not.toBeInTheDocument();
    }
    if (todo.created_at) {
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
    }
  }
  );
  it('calls updateTodo when checkbox is clicked', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useUpdateTodo).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockMutate).toHaveBeenCalledWith({
      id: 1,
      todo: { completed: true },
    });
  });

  it('displays loading spinner when pending', () => {

    vi.mocked(useUpdateTodo).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });


    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });
    const spinnerElement = document.querySelector('.animate-spin ');
    expect(spinnerElement).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument();
  });

  it('calls onEdit when edit menu item is clicked', async () => {

    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });

    const moreButton = document.querySelector('[data-slot="dropdown-menu-trigger"]') as Element;
    await userEvent.click(moreButton);

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('opens delete confirmation dialog when delete is clicked', async () => {

    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });

    const moreButton = document.querySelector('[data-slot="dropdown-menu-trigger"]') as Element;
    await userEvent.click(moreButton);

    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText(
      /This action cannot be undone\. This will permanently delete the todo titled "Test Todo"\./s
    )).toBeInTheDocument();
  });

  it('calls deleteTodo when delete is confirmed', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useDeleteTodo).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });

    const moreButton = document.querySelector('[data-slot="dropdown-menu-trigger"]') as Element;
    await userEvent.click(moreButton);
    await userEvent.click(screen.getByText('Delete'));

    const confirmButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith(1, {
      onSuccess: expect.any(Function),
    });
  });

  it('closes delete dialog when cancelled', async () => {

    render(<TodoItem todo={mockTodo} onEdit={mockOnEdit} />, { wrapper });

    const moreButton = document.querySelector('[data-slot="dropdown-menu-trigger"]') as Element;
    await userEvent.click(moreButton);
    await userEvent.click(screen.getByText('Delete'))

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });
  });

  it('shows completed style when todo is completed', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem todo={completedTodo} onEdit={mockOnEdit} />, { wrapper });

    const title = screen.getByText('Test Todo');
    expect(title).toHaveClass('line-through');
  });
});