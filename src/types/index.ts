export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  files: FileItem[];
  error?: string;
}

export interface AppState {
  currentProject: Project | null;
  messages: Message[];
  files: Record<string, string>;
  isGenerating: boolean;
  previewUrl: string | null;
}
