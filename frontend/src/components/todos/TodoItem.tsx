import { useState } from 'react';
import { useUpdateTodo, useDeleteTodo } from '@/hooks/use-todos';
import type { Todo } from '@/types/todo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Edit, MoreVertical, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isPending = updateTodo.isPending || deleteTodo.isPending;

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      todo: { completed: !todo.completed },
    });
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id, {
      onSuccess: () => setIsDeleteDialogOpen(false)
    });
  };

  const timeAgo = todo.created_at
    ? formatDistanceToNow(new Date(todo.created_at), { addSuffix: true })
    : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="flex items-center p-3 gap-3 border-b hover:bg-muted/50 transition-colors"
    >
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1">
        <label
          htmlFor={`todo-${todo.id}`}
          className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
        >
          {todo.title}
        </label>
        {todo.description && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            {todo.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/80 mt-1">{timeAgo}</p>
      </div>

      {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      
      {!isPending && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the todo
              titled "{todo.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}