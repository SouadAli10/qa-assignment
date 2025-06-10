import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateTodo, useUpdateTodo } from "@/hooks/use-todos"
import type { Todo } from "@/types/todo"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional().nullable(),
})

type TodoFormValues = z.infer<typeof formSchema>

interface TodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo?: Todo | null
}

export function TodoDialog({ open, onOpenChange, todo }: TodoDialogProps) {
  const form = useForm<TodoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const createTodo = useCreateTodo()
  const updateTodo = useUpdateTodo()

  const isEditing = !!todo
  const isPending = createTodo.isPending || updateTodo.isPending

  useEffect(() => {
    if (isEditing && todo) {
      form.reset({
        title: todo.title,
        description: todo.description,
      })
    } else {
      form.reset({
        title: "",
        description: "",
      })
    }
  }, [todo, isEditing, form])

  const onSubmit = (data: TodoFormValues) => {
    if (isEditing && todo) {
      updateTodo.mutate({ id: todo.id, todo: data }, {
        onSuccess: () => onOpenChange(false)
      })
    } else {
      createTodo.mutate(data, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Todo" : "Create Todo"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your todo."
              : "Add a new todo to your list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Finish QA report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any extra details..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Todo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 