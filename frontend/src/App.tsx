import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiSwitcher } from '@/components/ApiSwitcher';
import { TodoList } from '@/components/todos/TodoList';
import { CheckSquare, Sparkles, Terminal } from 'lucide-react';
import { Toaster } from "@/components/ui/sonner"
import { ThemeToggle } from '@/components/ThemeToggle';

function App() {
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <header className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <CheckSquare className="h-10 w-10 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Todo Master
              </h1>
            </div>
            <p className="text-muted-foreground">
              A beautiful todo application with dual API support
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="secondary">React 19</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">QA Ready</Badge>
            </div>
          </header>

          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          {/* Main Content */}
          <main className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <ApiSwitcher />
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Terminal className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">Testing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                    <p>• Golang API runs on port 3001.</p>
                    <p>• Node.js API runs on port 3000.</p>
                    <p>• Each API uses a separate SQLite database.</p>
                    <p>• Switch APIs to test data isolation.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Todo List */}
            <Card>
              <CardHeader>
                <CardTitle>My Todos</CardTitle>
              </CardHeader>
              <CardContent>
                <TodoList />
              </CardContent>
            </Card>

            {/* QA Focus Areas */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>QA Focus Areas</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div>
                  <h4 className='font-semibold text-foreground mb-1'>API Switching</h4>
                  <p>
                    Ensure todos persist correctly when switching between Node.js and Golang APIs. Data should be independent for each API.
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold text-foreground mb-1'>Error Handling</h4>
                  <p>
                    Test how the application handles API failures. Try stopping one of the backend services and observe the UI response.
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold text-foreground mb-1'>CRUD Functionality</h4>
                  <p>
                    Verify all Create, Read, Update, and Delete operations work as expected for each to-do item. Pay attention to edge cases like empty or long inputs.
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold text-foreground mb-1'>UI/UX</h4>
                  <p>
                    Check for visual consistency, responsiveness on different screen sizes, and intuitive user interactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-muted-foreground">
            <p>Built for QA Engineer Testing Assessment</p>
            <p className="mt-1">
              Test CRUD operations, API switching, error handling, and more!
            </p>
          </footer>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}

export default App;