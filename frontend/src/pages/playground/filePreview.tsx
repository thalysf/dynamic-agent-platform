import { ReactNode } from 'react';

export type ToolCall = {
  toolName?: string;
  status?: string;
  result?: {
    publicUrl?: string;
    path?: string;
    absolutePath?: string;
    mimeType?: string;
    bytesRead?: number;
    bytesWritten?: number;
    query?: string;
    source?: string;
    content?: string;
    contentBase64?: string;
    [key: string]: unknown;
  };
  error?: string;
};

export type FilePreview = {
  title: string;
  path: string;
  url: string;
  extension: string;
  language: string;
  content: string;
  loading: boolean;
  error: string | null;
};

export function fileToolCalls(toolCalls: ToolCall[]): ToolCall[] {
  return toolCalls.filter((call) => {
    if (call.status !== 'COMPLETED' || call.toolName !== 'file_write') {
      return false;
    }
    const result = call.result;
    return Boolean(result?.path || result?.publicUrl || result?.content || result?.contentBase64);
  });
}

export function filePreviewButtonLabel(call: ToolCall): string {
  const path = call.result?.path || call.result?.absolutePath || 'arquivo';
  const filename = path.split(/[\\/]/).filter(Boolean).pop() || path;
  const compact = filename.length > 28 ? `${filename.slice(0, 12)}...${filename.slice(-12)}` : filename;
  return `Abrir ${compact}`;
}

export function isHtmlExtension(extension: string): boolean {
  return extension === 'html' || extension === 'htm';
}

export function isMarkdownExtension(extension: string): boolean {
  return extension === 'md' || extension === 'markdown';
}

export function createLoadingFilePreview(call: ToolCall, title: string): FilePreview {
  const path = call.result?.path || call.result?.absolutePath || 'arquivo-gerado';
  const extension = fileExtension(path);
  return {
    title,
    path,
    url: call.result?.publicUrl || '',
    extension,
    language: languageForExtension(extension),
    content: '',
    loading: true,
    error: null,
  };
}

export async function loadFilePreview(call: ToolCall, title: string): Promise<FilePreview> {
  const result = call.result;
  if (!result) {
    throw new Error('Tool call sem resultado para abrir arquivo.');
  }

  const path = result.path || result.absolutePath || 'arquivo-gerado';
  const url = result.publicUrl || '';
  const extension = fileExtension(path);
  const basePreview: FilePreview = {
    title,
    path,
    url,
    extension,
    language: languageForExtension(extension),
    content: '',
    loading: false,
    error: null,
  };

  if (typeof result.content === 'string') {
    return { ...basePreview, content: previewContent(result.content, extension) };
  }
  if (typeof result.contentBase64 === 'string') {
    return { ...basePreview, content: previewContent(decodeBase64Content(result.contentBase64), extension) };
  }
  if (!url) {
    return { ...basePreview, error: 'Este arquivo nao possui URL publica para leitura.' };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao carregar arquivo: ${response.status}`);
    }
    const content = await response.text();
    return { ...basePreview, content: previewContent(content, extension) };
  } catch (reason) {
    return {
      ...basePreview,
      error: reason instanceof Error ? reason.message : 'Falha ao carregar arquivo.',
    };
  }
}

export function renderHighlightedCode(content: string, extension: string): ReactNode[] {
  if (!content) {
    return ['Arquivo vazio.'];
  }
  if (extension === 'txt') {
    return [content];
  }

  const pattern = syntaxPatternForExtension(extension);
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    const token = match[0];
    const className = syntaxClassForToken(token, extension);
    nodes.push(
      className ? (
        <span className={`code-token ${className}`} key={`${match.index}-${token}`}>
          {token}
        </span>
      ) : (
        token
      ),
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }
  return nodes;
}

export function renderMarkdownPreview(content: string): ReactNode[] {
  if (!content.trim()) {
    return ['Arquivo vazio.'];
  }

  const nodes: ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let list: { type: 'ordered' | 'unordered'; items: string[] } | null = null;

  const flushList = () => {
    if (!list) {
      return;
    }
    const items = list.items.map((item, index) => <li key={`item-${nodes.length}-${index}`}>{renderInlineMarkdown(item)}</li>);
    nodes.push(
      list.type === 'ordered' ? (
        <ol key={`ordered-${nodes.length}`}>{items}</ol>
      ) : (
        <ul key={`unordered-${nodes.length}`}>{items}</ul>
      ),
    );
    list = null;
  };

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = Math.min(heading[1].length, 3);
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      nodes.push(<Tag key={`heading-${lineIndex}`}>{renderInlineMarkdown(heading[2])}</Tag>);
      return;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (!list || list.type !== 'ordered') {
        flushList();
        list = { type: 'ordered', items: [] };
      }
      list.items.push(ordered[1]);
      return;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (!list || list.type !== 'unordered') {
        flushList();
        list = { type: 'unordered', items: [] };
      }
      list.items.push(unordered[1]);
      return;
    }

    flushList();
    nodes.push(<p key={`paragraph-${lineIndex}`}>{renderInlineMarkdown(line)}</p>);
  });

  flushList();
  return nodes;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function fileExtension(path: string): string {
  const cleanPath = path.split('?')[0]?.split('#')[0] ?? path;
  const filename = cleanPath.split('/').pop() ?? cleanPath;
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : 'txt';
}

function languageForExtension(extension: string): string {
  const languages: Record<string, string> = {
    css: 'CSS',
    html: 'HTML',
    htm: 'HTML',
    java: 'Java',
    js: 'JavaScript',
    json: 'JSON',
    jsx: 'React JSX',
    md: 'Markdown',
    py: 'Python',
    ts: 'TypeScript',
    tsx: 'React TSX',
    txt: 'Texto',
    yml: 'YAML',
    yaml: 'YAML',
  };
  return languages[extension] ?? extension.toUpperCase();
}

function decodeBase64Content(value: string): string {
  try {
    return decodeURIComponent(
      Array.from(window.atob(value))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch {
    return 'Conteudo binario em base64. Nao foi possivel renderizar como texto.';
  }
}

function previewContent(content: string, extension: string): string {
  if (isHtmlExtension(extension)) {
    return formatHtmlPreview(content);
  }
  return content;
}

function formatHtmlPreview(content: string): string {
  const trimmed = content.trim();
  if (!trimmed || trimmed.includes('\n')) {
    return content;
  }
  const withBreaks = trimmed
    .replace(/>\s*</g, '>\n<')
    .replace(/(<\/style>)/gi, '$1\n')
    .replace(/(<script[^>]*>)/gi, '$1\n')
    .replace(/(<\/script>)/gi, '\n$1');
  const lines = withBreaks.split('\n').map((line) => line.trim()).filter(Boolean);
  let indent = 0;
  return lines
    .map((line) => {
      if (/^<\/(?!html)/i.test(line)) {
        indent = Math.max(0, indent - 1);
      }
      const formatted = `${'  '.repeat(indent)}${line}`;
      if (/^<[^/!][^>]*[^/]>(?!.*<\/)/.test(line) && !/^<(meta|link|input|br|hr|img)\b/i.test(line)) {
        indent += 1;
      }
      return formatted;
    })
    .join('\n');
}

function syntaxClassForToken(token: string, extension: string): string {
  if (/^["'`].*["'`]$/.test(token)) {
    return 'string';
  }
  if (/^<!--|^\/\*|^#|^\/\//.test(token)) {
    return 'comment';
  }
  if (/^\d+(\.\d+)?$/.test(token)) {
    return 'number';
  }
  if (isHtmlExtension(extension)) {
    if (/^<\/?[A-Za-z][\w-]*/.test(token) || token === '>' || token === '/>') {
      return 'tag';
    }
    if (/^[\w-]+(?==)/.test(token)) {
      return 'attribute';
    }
  }
  if (
    extension === 'py' &&
    /^(False|None|True|and|as|async|await|class|def|elif|else|except|finally|for|from|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield)$/.test(
      token,
    )
  ) {
    return 'keyword';
  }
  if (
    /^(break|case|catch|class|const|continue|default|else|export|extends|finally|for|from|function|if|import|interface|let|new|return|switch|throw|try|type|var|while)$/.test(
      token,
    )
  ) {
    return 'keyword';
  }
  if (/^(boolean|number|string|void|Promise|Record|Array|React|Request|Response)$/.test(token)) {
    return 'type';
  }
  return '';
}

function syntaxPatternForExtension(extension: string): RegExp {
  if (isHtmlExtension(extension)) {
    return /(<!--[\s\S]*?-->|<\/?[A-Za-z][\w-]*|\/?>|[\w-]+(?==)|"[^"]*"|'[^']*')/g;
  }
  if (extension === 'py') {
    return /(#.*|"""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w]*\b)/g;
  }
  return /(\/\/.*|\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
}
