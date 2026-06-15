'use client';

import { useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
}

function buildFileTree(files: Record<string, string>): FileTreeItem[] {
  const root: FileTreeItem[] = [];

  Object.keys(files).forEach((path) => {
    const parts = path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.find((item) => item.name === part);

      if (existing) {
        if (!isFile) {
          current = existing.children || [];
        }
      } else {
        const newItem: FileTreeItem = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        current.push(newItem);
        if (!isFile) {
          current = newItem.children!;
        }
      }
    });
  });

  return root;
}

function FileTreeView({
  items,
  selectedFile,
  onSelect,
  depth = 0,
}: {
  items: FileTreeItem[];
  selectedFile: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="select-none">
      {items.map((item) => (
        <div key={item.path}>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-800 rounded text-sm',
              selectedFile === item.path && 'bg-gray-800 text-blue-400'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (item.type === 'folder') {
                setExpanded((prev) => ({ ...prev, [item.path]: !prev[item.path] }));
              } else {
                onSelect(item.path);
              }
            }}
          >
            {item.type === 'folder' ? (
              <>
                {expanded[item.path] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Folder className="w-4 h-4 text-yellow-500" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <File className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="truncate">{item.name}</span>
          </div>
          {item.type === 'folder' && expanded[item.path] && item.children && (
            <FileTreeView
              items={item.children}
              selectedFile={selectedFile}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CodeEditor() {
  const { files, selectedFile, setSelectedFile, updateFile } = useAppStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const fileTree = buildFileTree(files);
  const currentFile = selectedFile ? files[selectedFile] : null;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('lovable-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#aeafad',
        'editor.selectionBackground': '#264f78',
      },
    });

    monaco.editor.setTheme('lovable-dark');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      updateFile(selectedFile, value);
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      html: 'html',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* File Tree */}
      <div className="h-40 border-b border-gray-800 overflow-hidden">
        <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-900">
          Files
        </div>
        <ScrollArea className="h-[calc(100%-32px)]">
          <FileTreeView
            items={fileTree}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
          />
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {selectedFile ? (
          <Editor
            height="100%"
            language={getLanguage(selectedFile)}
            value={currentFile || ''}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Selecione um arquivo para editar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
