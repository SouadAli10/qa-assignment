export interface Todo {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string | null;
  completed?: boolean;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string | null;
  completed?: boolean;
}