'use client';

import { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Folder, ChevronRight, ChevronDown, Search } from 'lucide-react';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  children?: FileTreeItem[];
}

function buildFileTree(files: Record<string, string>): FileTreeItem[] {
  const root: FileTreeItem[] = [];
  const getLang = (p: string) => p.split('.').pop()?.toLowerCase() || 'txt';

  Object.keys(files).forEach((path) => {
    const parts = path.split('/');
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.find((item) => item.name === part);
      if (existing) {
        if (!isFile) current = existing.children || [];
      } else {
        const newItem: FileTreeItem = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          language: isFile ? getLang(path) : undefined,
          children: isFile ? undefined : [],
        };
        current.push(newItem);
        if (!isFile) current = newItem.children!;
      }
    });
  });
  return root;
}

const FILE_ICONS: Record<string, string> = {
  tsx: '⚛',
  ts: '📘',
  jsx: '⚛',
  js: '📜',
  json: '⚙',
  css: '🎨',
  html: '🌐',
  md: '📝',
};

function FileIcon({ name, type }: { name: string; type: 'file' | 'folder' }) {
  if (type === 'folder') return <Folder className="w-3.5 h-3.5 text-amber-400/80" />;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return <span className="text-[11px] w-4 text-center flex-shrink-0">{FILE_ICONS[ext] || '📄'}</span>;
}

function FileTreeView({
  items,
  selectedFile,
  onSelect,
  depth = 0,
  search,
}: {
  items: FileTreeItem[];
  selectedFile: string | null;
  onSelect: (path: string) => void;
  depth?: number;
  search: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((i) => { if (i.type === 'folder') init[i.path] = true; });
    return init;
  });

  const filtered = items.filter((item) =>
    search ? item.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="select-none">
      {filtered.map((item) => (
        <div key={item.path}>
          <div
            className={cn(
              'flex items-center gap-1.5 py-1 rounded-md text-[13px] cursor-pointer transition-colors',
              'hover:bg-white/5',
              selectedFile === item.path && 'bg-violet-500/15 text-white'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px' }}
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
                  <ChevronDown className="w-3 h-3 text-white/40 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                )}
                <FileIcon name={item.name} type="folder" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileIcon name={item.name} type="file" />
              </>
            )}
            <span className="truncate text-white/80">{item.name}</span>
          </div>
          {item.type === 'folder' && expanded[item.path] && item.children && (
            <FileTreeView
              items={item.children}
              selectedFile={selectedFile}
              onSelect={onSelect}
              depth={depth + 1}
              search={search}
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
  const [search, setSearch] = useState('');

  const fileTree = buildFileTree(files);
  const currentFile = selectedFile ? files[selectedFile] : null;

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('lovable-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#e4e4e7',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorCursor.foreground': '#a78bfa',
        'editor.selectionBackground': '#7c3aed33',
        'editor.inactiveSelectionBackground': '#7c3aed22',
      },
    });
    monaco.editor.setTheme('lovable-dark');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) updateFile(selectedFile, value);
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      json: 'json', css: 'css', html: 'html', md: 'markdown',
    };
    return map[ext || ''] || 'plaintext';
  };

  if (Object.keys(files).length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center">
            <File className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-sm font-medium text-white/70">Nenhum arquivo ainda</p>
          <p className="text-xs text-white/40 mt-1">Vá no Chat e peça para gerar um app</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0a0a0f]">
      {/* File tree */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0f0f17] flex flex-col">
        <div className="p-2 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar arquivos..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/3 border border-white/5 rounded-md text-[12px] text-white placeholder-white/30 outline-none focus:border-violet-500/30 transition-colors"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-1.5">
            <FileTreeView
              items={fileTree}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
              search={search}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedFile ? (
          <>
            {/* File tab */}
            <div className="h-9 flex-shrink-0 bg-[#0f0f17] border-b border-white/5 flex items-center px-3 gap-2">
              <File className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[12px] text-white/70 font-mono">{selectedFile}</span>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={getLanguage(selectedFile)}
                value={currentFile || ''}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  renderLineHighlight: 'gutter',
                  cursorBlinking: 'smooth',
                }}
              />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-white/50">Selecione um arquivo para editar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}