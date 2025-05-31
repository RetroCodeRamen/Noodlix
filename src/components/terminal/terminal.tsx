
'use client';

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import TerminalInput from './terminal-input';
import TerminalOutputLine from './terminal-output-line';
import type { User, FileSystem as IFileSystem, OutputLine, CommandProcessor as ICommandProcessor, FileNode, LinkEntry } from '@/types';
import { ShellProcessor } from '@/core/shell-processor';
import { FileSystemImpl } from '@/core/file-system';
import { getAllCommandNames } from '@/core/commands-registry';
import { useAuth } from '@/hooks/use-auth-hook';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // For browser mode input
import { ScrollArea } from '@/components/ui/scroll-area'; // For browser content
import { Loader2 } from 'lucide-react';


const MAX_HISTORY = 50;

const Terminal: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isLoadingCommand, setIsLoadingCommand] = useState(false);
  
  // State for inline editor
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null);
  const [editingFileContent, setEditingFileContent] = useState('');
  const [initialEditingFileContent, setInitialEditingFileContent] = useState('');

  // State for noodl
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isBrowserPageLoading, setIsBrowserPageLoading] = useState(false);
  const [browsingUrl, setBrowsingUrl] = useState<string | null>(null);
  const [browsingPageTitle, setBrowsingPageTitle] = useState<string | null>(null);
  const [browsingContentLines, setBrowsingContentLines] = useState<string[]>([]);
  const [browsingLinks, setBrowsingLinks] = useState<LinkEntry[]>([]);
  const [browserModeInput, setBrowserModeInput] = useState('');
  const [browserPageError, setBrowserPageError] = useState<string | null>(null);

  const outputScrollAreaRef = useRef<HTMLDivElement>(null); 
  const lastOutputLineRef = useRef<HTMLDivElement>(null); 
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const browserModeInputRef = useRef<HTMLInputElement>(null);

  const [fileSystem] = useState<IFileSystem>(() => new FileSystemImpl());
  const [shellProcessor, setShellProcessor] = useState<ShellProcessor | null>(null);

  const terminalCommandProcessor: ICommandProcessor = {
    executeCommand: async (commandLine: string) => {
      await processAndDisplayCommand(commandLine);
    },
    typeCommand: async (commandLine: string, speed: number = 50) => {
      addOutputLine({text: `Simulating typing: ${commandLine}` });
    }
  };

  useEffect(() => {
    if (user) {
      fileSystem.initializeForUser(user);
      const newShellProcessor = new ShellProcessor(fileSystem, user, terminalCommandProcessor);
      setShellProcessor(newShellProcessor);
      
      const welcomeMessages = fileSystem.getWelcomeMessage();
      const initialOutput: OutputLine[] = welcomeMessages.map(text => ({ id: crypto.randomUUID(), text }));
      setOutputLines(initialOutput);
      setCurrentPrompt(fileSystem.getPrompt(user));
    }
  }, [user, fileSystem]);

  useEffect(() => {
    if (isEditingFile && editorTextareaRef.current) {
      editorTextareaRef.current.focus();
    } else if (isBrowsing && browserModeInputRef.current && !isBrowserPageLoading) { 
      browserModeInputRef.current.focus();
    } else if (!isEditingFile && !isBrowsing) {
      const mainInput = document.querySelector<HTMLInputElement>('.flex-grow input:not([type=hidden])');
      mainInput?.focus();
    }
  }, [isEditingFile, isBrowsing, isBrowserPageLoading]); 

  const addOutputLine = useCallback((line: Partial<OutputLine> & { text: string | string[] }) => {
    setOutputLines(prev => [...prev, { id: crypto.randomUUID(), ...line }]);
  }, []);

  const loadFileForEditing = useCallback(async (filePath: string) => {
    if (!fileSystem || !user) return false;
    const fileNode = fileSystem.getNode(filePath);
    let fileContent = '';
    
    if (fileNode) {
      if (fileNode.type === 'file') {
        const readResult = fileSystem.readFile(filePath);
        if (typeof readResult === 'string' && !readResult.startsWith(`${fileNode.name}:`) && !readResult.startsWith(`cat:`)) {
          fileContent = readResult;
        } else if (typeof readResult === 'string') {
          addOutputLine({ text: `note: Error reading file: ${readResult}`, isError: true });
          return false;
        }
      } else {
        addOutputLine({ text: `note: ${filePath} is a directory`, isError: true });
        return false;
      }
    }
    
    setEditingFilePath(filePath);
    setEditingFileContent(fileContent);
    setInitialEditingFileContent(fileContent);
    setIsEditingFile(true);
    return true;
  }, [fileSystem, user, addOutputLine]);

  const handleSaveFile = async () => {
    if (!editingFilePath || !user || !fileSystem) return;
    const result = fileSystem.writeFile(editingFilePath, editingFileContent, user);
    if (result === null) {
      const shortFileName = editingFilePath.split('/').pop() || editingFilePath;
      addOutputLine({ text: `[ Wrote ${editingFileContent.split('\n').length} lines to ${shortFileName} ]`});
      setInitialEditingFileContent(editingFileContent);
    } else {
      addOutputLine({ text: `[ Error saving ${editingFilePath}: ${result} ]`, isError: true });
    }
  };

  const handleExitEditor = () => {
    if (editingFileContent !== initialEditingFileContent) {
      addOutputLine({ text: `[ Unsaved changes to ${editingFilePath} will be lost. Exiting. ]`, isError: true });
    }
    addOutputLine({ text: `Exited editor for ${editingFilePath}` });
    setIsEditingFile(false);
    setEditingFilePath(null);
    setEditingFileContent('');
    setInitialEditingFileContent('');
    if (user && fileSystem) {
        setCurrentPrompt(fileSystem.getPrompt(user));
    }
    setIsLoadingCommand(false);
  };

  const extractTextAndLinksFromHtml = (htmlString: string, baseUrl: string): { title: string, contentLines: string[], links: LinkEntry[] } => {
    if (typeof DOMParser === 'undefined') {
      return { title: 'Error', contentLines: ['DOMParser not available.'], links: [] };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const pageTitle = doc.title || new URL(baseUrl).hostname; 

    const links: LinkEntry[] = [];
    doc.querySelectorAll('a').forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (href) {
        try {
          const resolvedUrl = new URL(href, baseUrl).toString();
          links.push({
            text: anchor.textContent?.trim().replace(/\s+/g, ' ') || resolvedUrl,
            href: resolvedUrl,
          });
        } catch (e) {
          console.warn(`NoodlBrowse: Invalid href '${href}' on page ${baseUrl}`);
        }
      }
    });

    doc.querySelectorAll('script, style, noscript, iframe, img, svg, head, header, footer, nav, aside, form').forEach(el => el.remove());
    
    let extractedText = "";
    const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            extractedText += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();
            const blockElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'blockquote', 'div', 'br', 'hr', 'table', 'tr', 'section', 'article'];
            if (blockElements.includes(tagName)) extractedText += '\n';
            el.childNodes.forEach(processNode);
            if (blockElements.includes(tagName)) extractedText += '\n';
        }
    };
    if (doc.body) doc.body.childNodes.forEach(processNode);
    
    const contentLines = extractedText
        .split('\n')
        .map(line => line.trim().replace(/\s+/g, ' '))
        .filter(line => line.length > 0);

    const MAX_BROWSER_LINES = 200;
    if (contentLines.length > MAX_BROWSER_LINES) {
        contentLines.splice(MAX_BROWSER_LINES, contentLines.length - MAX_BROWSER_LINES, `\n... (Content truncated. Total lines: ${contentLines.length}) ...`);
    }

    return { title: pageTitle, contentLines, links };
  };

  const loadPageIntoBrowser = async (url: string) => {
    if (!url) return;
    setIsBrowserPageLoading(true);
    setBrowserPageError(null);
    setBrowsingUrl(url);
    setBrowsingContentLines([]); 
    setBrowsingLinks([]);       
    setBrowsingPageTitle('Loading...');

    try {
      const proxyUrl = new URL('/api/proxy', window.location.origin);
      proxyUrl.searchParams.append('url', url);
      const response = await fetch(proxyUrl.toString());
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Failed to fetch: ${response.statusText}`);
      }
      
      const { title, contentLines, links } = extractTextAndLinksFromHtml(data.html, url);
      setBrowsingPageTitle(title);
      setBrowsingContentLines(contentLines);
      setBrowsingLinks(links.slice(0, 99)); 
    } catch (error: any) {
      setBrowserPageError(error.message || 'Failed to load page.');
      setBrowsingPageTitle('Error');
    } finally {
      setIsBrowserPageLoading(false);
    }
  };

  const handleBrowserInputSubmit = () => {
    const input = browserModeInput.trim().toLowerCase();
    setBrowserModeInput('');

    if (input === 'q' || input === 'quit') {
      setIsBrowsing(false);
      setBrowsingUrl(null);
      setBrowsingPageTitle(null);
      setBrowsingContentLines([]);
      setBrowsingLinks([]);
      setBrowserPageError(null);
      if (user && fileSystem) setCurrentPrompt(fileSystem.getPrompt(user));
      setIsLoadingCommand(false); 
    } else if (/^\d+$/.test(input)) {
      const linkIndex = parseInt(input, 10) - 1;
      if (linkIndex >= 0 && linkIndex < browsingLinks.length) {
        loadPageIntoBrowser(browsingLinks[linkIndex].href);
      } else {
        setBrowserPageError(`Invalid link number: ${input}. Choose 1-${browsingLinks.length}.`);
      }
    } else if (input) {
        setBrowserPageError(`Unknown command: ${input}. Enter link number or 'q' to quit.`);
    }
  };

  const processAndDisplayCommand = useCallback(async (command: string) => {
    if (!shellProcessor || !user) return;
    setIsLoadingCommand(true);

    addOutputLine({ text: command, isCommand: true, prompt: currentPrompt });

    if (command.trim() !== '' && (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command)) {
      setCommandHistory(prev => [...prev, command].slice(-MAX_HISTORY));
    }
    setHistoryIndex(-1);

    const result = await shellProcessor.processCommand(command);

    if (result === '__CLEAR__') {
      setOutputLines([]);
      setIsLoadingCommand(false); // Ensure loading is stopped after clear
    } else if (result === '__LOGOUT__') {
      authLogout();
      localStorage.removeItem('noodlix_filesystem'); 
      localStorage.removeItem('noodlix_users');
      localStorage.removeItem('noodlix_user_session');
      // isLoadingCommand will be implicitly false on redirect or page change
    } else if (typeof result === 'string' && result.startsWith('__NOTE_EDIT__')) {
        try {
            const payloadString = result.substring('__NOTE_EDIT__'.length);
            const payload = JSON.parse(payloadString);
            const success = await loadFileForEditing(payload.filename);
            if (!success) {
              // If editor fails to open, reset prompt and loading state
              setCurrentPrompt(fileSystem.getPrompt(user));
              setIsLoadingCommand(false); 
            }
            // If success, editor mode handles its own loading state internally
        } catch (e) {
            addOutputLine({ text: 'Error opening editor: Invalid payload.', isError: true });
            setCurrentPrompt(fileSystem.getPrompt(user));
            setIsLoadingCommand(false);
        }
    } else if (typeof result === 'string' && result.startsWith('__BROWSE_INITIATE__')) {
        const urlToBrowse = result.substring('__BROWSE_INITIATE__'.length);
        setIsBrowsing(true);
        await loadPageIntoBrowser(urlToBrowse); 
        // Browser mode handles its own loading state, command loading is effectively done for terminal
        // setIsLoadingCommand(false) is handled when browser mode exits
    } else if (result !== '') {
      addOutputLine({ text: result, isError: typeof result === 'string' && (result.includes(': command not found') || result.includes(': permission denied') || result.includes('No such file or directory') || result.includes('Not a directory'))});
      setIsLoadingCommand(false); 
    } else {
      // Command produced no output (e.g. successful cd)
      setIsLoadingCommand(false); 
    }
    
    // Update prompt if not in editor or browser mode
    if (!isEditingFile && !isBrowsing) { 
        setCurrentPrompt(fileSystem.getPrompt(user));
    }
  }, [shellProcessor, user, currentPrompt, commandHistory, addOutputLine, authLogout, fileSystem, loadFileForEditing, isEditingFile, isBrowsing, loadPageIntoBrowser]);


  const handleSubmitCommand = (command: string) => {
    if (isLoadingCommand) return;
    processAndDisplayCommand(command);
  };

  const handleCommandHistory = (direction: 'up' | 'down'): string => {
    if (commandHistory.length === 0) return '';

    let newIndex = historyIndex;
    if (direction === 'up') {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length -1 , historyIndex + 1);
      if (newIndex === historyIndex && historyIndex === commandHistory.length -1) {
          setHistoryIndex(-1);
          return '';
      }
    }
    setHistoryIndex(newIndex);
    return newIndex !== -1 ? commandHistory[newIndex] : '';
  };

  const getCommandSuggestions = (partialCommand: string): string[] => {
    if (!partialCommand.trim()) return [];
    const parts = partialCommand.split(' ');
    const commandPart = parts[0].toLowerCase();
    return getAllCommandNames()
      .filter(name => name.startsWith(commandPart))
      .slice(0, 5);
  };
  
  useEffect(() => {
    if (!isEditingFile && !isBrowsing && lastOutputLineRef.current) {
      const timer = setTimeout(() => {
        lastOutputLineRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 0); 
      return () => clearTimeout(timer);
    }
  }, [outputLines, isEditingFile, isBrowsing, isLoadingCommand]);

  if (!user || !shellProcessor) {
    return <div className="p-4 text-muted-foreground">Initializing Noodlix Terminal...</div>;
  }

  if (isEditingFile) {
    return (
      <div className="flex flex-col h-full p-2 md:p-4 text-foreground font-code text-sm overflow-hidden">
        <div className="bg-secondary text-secondary-foreground px-3 py-1.5 text-xs select-none border-b border-border">
          Noodlix Note Editor - {editingFilePath}
          <span className="ml-auto float-right text-muted-foreground">Unsaved changes: {editingFileContent !== initialEditingFileContent ? '*' : ''}</span>
        </div>
        <Textarea
          ref={editorTextareaRef}
          value={editingFileContent}
          onChange={(e) => setEditingFileContent(e.target.value)}
          className="flex-grow font-code text-sm resize-none bg-background border-0 focus:ring-0 focus:outline-none rounded-none h-[calc(100%-60px)] p-2"
          placeholder="Start typing..."
        />
        <div className="bg-secondary p-2 flex justify-end gap-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleSaveFile} disabled={editingFileContent === initialEditingFileContent && editingFilePath !== null}>
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExitEditor}>
            Exit Editor
          </Button>
        </div>
      </div>
    );
  }

  if (isBrowsing) {
    return (
      <div className="flex flex-col h-full p-2 md:p-4 text-foreground font-code text-sm overflow-hidden">
        <div className="bg-secondary text-secondary-foreground px-3 py-1.5 text-xs select-none border-b border-border truncate">
          Noodlix NoodlBrowse: {browsingPageTitle || 'No Title'} ({browsingUrl})
        </div>
        <ScrollArea className="flex-grow my-1 p-1 border border-border rounded bg-background/50" viewportRef={outputScrollAreaRef}>
          {isBrowserPageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-2">Loading page...</span>
            </div>
          ) : browserPageError ? (
            <div className="text-red-400 p-2">Error: {browserPageError}</div>
          ) : (
            <>
              {browsingContentLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words">{line || '\u00A0'}</div> 
              ))}
              {browsingLinks.length > 0 && (
                <div className="mt-4 pt-2 border-t border-border">
                  <div className="font-medium mb-1 text-accent">Links:</div>
                  {browsingLinks.map((link, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="text-primary">{idx + 1}.</span> {link.text} (<span className="text-muted-foreground text-xs truncate max-w-[200px] inline-block align-bottom">{link.href}</span>)
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ScrollArea>
        <div className="mt-1 p-1 bg-secondary border-t border-border">
          <div className="flex items-center">
            <span className="text-accent mr-1">NoodlBrowse (#/Q) &gt;</span>
            <Input
              ref={browserModeInputRef}
              type="text"
              value={browserModeInput}
              onChange={(e) => setBrowserModeInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBrowserInputSubmit();
                }
              }}
              className="flex-1 bg-transparent border-0 focus:ring-0 outline-none p-0 text-inherit placeholder-muted-foreground/50 h-6 text-sm"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default Terminal UI
  return (
    <div className="flex flex-col h-full p-2 md:p-4 text-foreground font-code text-sm overflow-hidden">
      <ScrollArea 
        className="flex-grow" 
        viewportRef={outputScrollAreaRef} 
        onClick={() => document.querySelector<HTMLInputElement>('.flex-grow input:not([type=hidden])')?.focus()}
      >
        {outputLines.map((line, index) => (
          <div key={line.id} ref={index === outputLines.length - 1 ? lastOutputLineRef : null}>
            <TerminalOutputLine line={line} />
          </div>
        ))}
      </ScrollArea>
      {!isLoadingCommand && (
        <div className="mt-2">
          <TerminalInput
            prompt={currentPrompt}
            onSubmit={handleSubmitCommand}
            onCommandHistory={handleCommandHistory}
            getSuggestions={getCommandSuggestions}
          />
        </div>
      )}
      {isLoadingCommand && (
         <div className="mt-2 flex items-center">
           <span className="text-accent">{currentPrompt}</span>
           <span className="animate-pulse pl-2">Processing...</span>
         </div>
      )}
    </div>
  );
};

export default Terminal;
    

    

