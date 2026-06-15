import { create } from 'zustand';
import type { Message, FileItem } from '@/types';

interface AppStore {
  messages: Message[];
  files: Record<string, string>;
  isGenerating: boolean;
  previewUrl: string | null;
  selectedFile: string | null;

  addMessage: (message: Message) => void;
  setFiles: (files: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (path: string, content: string) => void;
  setGenerating: (generating: boolean) => void;
  setPreviewUrl: (url: string | null) => void;
  setSelectedFile: (path: string | null) => void;
  clearProject: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  messages: [],
  files: {},
  isGenerating: false,
  previewUrl: null,
  selectedFile: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setFiles: (files) =>
    set(() => ({
      files,
    })),

  updateFile: (path, content) =>
    set((state) => ({
      files: {
        ...state.files,
        [path]: content,
      },
    })),

  addFile: (path, content) =>
    set((state) => ({
      files: {
        ...state.files,
        [path]: content,
      },
    })),

  setGenerating: (generating) =>
    set(() => ({
      isGenerating: generating,
    })),

  setPreviewUrl: (url) =>
    set(() => ({
      previewUrl: url,
    })),

  setSelectedFile: (path) =>
    set(() => ({
      selectedFile: path,
    })),

  clearProject: () =>
    set(() => ({
      messages: [],
      files: {},
      isGenerating: false,
      previewUrl: null,
      selectedFile: null,
    })),
}));
