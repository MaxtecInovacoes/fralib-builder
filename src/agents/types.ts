export interface AgentResponse {
  success: boolean;
  content?: string;
  files?: Record<string, string>;
  error?: string;
}

export interface TaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: AgentResponse;
  error?: string;
}

export interface GenerationPlan {
  specification: string;
  tasks: string[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}
