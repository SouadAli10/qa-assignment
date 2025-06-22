import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoDialog } from './TodoDialog';
import { useCreateTodo, useUpdateTodo } from '@/hooks/use-todos';
import type { Todo } from '@/types/todo';

// Mock the hooks
vi.mock('@/hooks/use-todos');

const mockTodo: Todo = {
  id: '1',
  title: 'Existing Todo',
  description: 'Existing description',
  completed: false,
  created_at: '2023-01-01T00:00:00Z',
};

describe('TodoDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.mocked(useCreateTodo).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(useUpdateTodo).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders create todo dialog with empty form', () => {
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByRole('button', { name: 'Create Todo' })).toBeInTheDocument();
    expect(screen.getByText('Add a new todo to your list.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Description (Optional)')).toHaveValue('');
  });

  it('renders edit todo dialog with pre-filled form', () => {
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} todo={mockTodo} />
    );

    expect(screen.getByText('Edit Todo')).toBeInTheDocument();
    expect(screen.getByText('Update the details of your todo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue(mockTodo.title);
    expect(screen.getByLabelText('Description (Optional)')).toHaveValue(mockTodo.description ?? '');
  });

  it('validates form inputs', async () => {
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    const submitButton = screen.getByRole('button', { name: /create todo/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  it('submits create todo form', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useCreateTodo).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await userEvent.type(screen.getByLabelText('Title'), 'New Todo');
    await userEvent.type(screen.getByLabelText('Description (Optional)'), 'New description');
    await userEvent.click(screen.getByRole('button', { name: /create todo/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        title: 'New Todo',
        description: 'New description',
      }, { onSuccess: expect.any(Function) });
    });
  });

  it('submits edit todo form', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useUpdateTodo).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} todo={mockTodo} />
    );

    const titleInput = screen.getByLabelText('Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Todo');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: '1',
        todo: {
          title: 'Updated Todo',
          description: mockTodo.description,
        },
      }, { onSuccess: expect.any(Function) });
    });
  });

  it('shows loading state during submission', () => {
    vi.mocked(useCreateTodo).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByRole('button', { name: /create todo/i })).toBeDisabled();
    const spinnerElement = document.querySelector('.animate-spin ');
    expect(spinnerElement).toBeInTheDocument();
  });

  it('closes dialog when cancel is clicked', async () => {
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles null description correctly', async () => {
    const todoWithNullDescription = { ...mockTodo, description: null };
    render(
      <TodoDialog open={true} onOpenChange={mockOnOpenChange} todo={todoWithNullDescription} />
    );

    expect(screen.getByLabelText('Description (Optional)')).toHaveValue('');
  });
});