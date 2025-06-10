import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/services/todo-api';
import { API_CONFIGS, getCurrentBackend, setCurrentBackend } from '@/lib/api-config';
import type { ApiBackend } from '@/lib/api-config';
import { useApiHealth } from '@/hooks/use-todos';
import { Server, Check, X, Database, Bot } from 'lucide-react';

export function ApiSwitcher() {
  const [selectedBackend, setSelectedBackend] = useState<ApiBackend>(getCurrentBackend());
  const queryClient = useQueryClient();
  const { data: isHealthy, isLoading } = useApiHealth();

  const handleSwitch = (backend: ApiBackend) => {
    if (backend === selectedBackend) return;
    setSelectedBackend(backend);
    setCurrentBackend(backend);
    todoApi.switchBackend(backend);
    queryClient.invalidateQueries();
  };

  const icons: { [key in ApiBackend]: React.ReactNode } = {
    golang: <Database className="h-5 w-5 text-cyan-500" />,
    nodejs: <Bot className="h-5 w-5 text-green-500" />
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Server className="h-5 w-5" />
          API Backend
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Checking...</span>
          ) : isHealthy ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-3 w-3" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <X className="h-3 w-3" /> Disconnected
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(API_CONFIGS) as ApiBackend[]).map((backend) => (
          <Button
            key={backend}
            variant={selectedBackend === backend ? 'default' : 'outline'}
            onClick={() => handleSwitch(backend)}
            className="w-full h-16 flex flex-col items-center justify-center"
          >
            {icons[backend]}
            <span className="font-medium mt-1">{API_CONFIGS[backend].name}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}