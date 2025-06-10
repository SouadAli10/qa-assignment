import { useState, useMemo } from 'react';
import { useTodos } from '@/hooks/use-todos';
import { TodoItem } from './TodoItem';
import { TodoDialog } from './TodoDialog';
import { TodoSkeleton } from './TodoSkeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ListChecks, PartyPopper } from 'lucide-react';
import type { Todo } from '@/types/todo';
import { AnimatePresence } from 'framer-motion';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type FilterType = "all" | "active" | "completed";

export function TodoList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: todos = [], isLoading, error } = useTodos();

  const handleEdit = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTodo(null);
    setIsDialogOpen(true);
  };

  const filteredTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((todo) => !todo.completed);
    }
    if (filter === "completed") {
      return todos.filter((todo) => todo.completed);
    }
    return todos;
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);
  
  if (isLoading) {
    return <TodoSkeleton />;
  }

  if (error) {
    return (
      <Card className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load todos</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <ToggleGroup 
          type="single" 
          value={filter}
          onValueChange={(value: FilterType) => value && setFilter(value)}
          aria-label="Filter todos"
          className="gap-1"
        >
          <ToggleGroupItem value="all" aria-label="All items">All</ToggleGroupItem>
          <ToggleGroupItem value="active" aria-label="Active items">Active</ToggleGroupItem>
          <ToggleGroupItem value="completed" aria-label="Completed items">Completed</ToggleGroupItem>
        </ToggleGroup>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Todo
        </Button>
      </div>
      
      <div className="space-y-2 h-[450px] overflow-y-auto pr-2">
        {todos.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No todos yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add Todo" to create your first task.
            </p>
          </div>
        ) : filteredTodos.length > 0 ? (
          <AnimatePresence>
            {filteredTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onEdit={handleEdit} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <PartyPopper className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium">All done!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You've completed all your tasks. Great work!
            </p>
          </div>
        )}
      </div>

      <TodoDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        todo={selectedTodo}
      />
    </div>
  );
}