import React from 'react';
import type { OutputLine } from '@/types';

interface TerminalOutputLineProps {
  line: OutputLine;
}

const TerminalOutputLine: React.FC<TerminalOutputLineProps> = ({ line }) => {
  // Helper to render text, replacing spaces for pre-wrap compatibility and escaping HTML
  const formatTextForHtml = (text: string) => {
    // Basic HTML escaping
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escapedText.replace(/ /g, '&nbsp;');
  };

  // Case 1: This line is a command echo with a prompt. Render prompt and command text inline.
  if (line.isCommand && line.prompt && typeof line.text === 'string') {
    return (
      <div className={`whitespace-pre-wrap break-words ${line.isError ? 'text-red-400' : ''}`}>
        <span className="text-accent" dangerouslySetInnerHTML={{ __html: formatTextForHtml(line.prompt) }} />
        <span dangerouslySetInnerHTML={{ __html: formatTextForHtml(line.text) }} />
      </div>
    );
  }

  // Case 2: For all other lines (multi-line output, single line output without prompt, errors, etc.)
  const renderContent = () => {
    if (Array.isArray(line.text)) {
      // If text is an array, render each item in its own div
      return line.text.map((t, i) => <div key={i} dangerouslySetInnerHTML={{ __html: formatTextForHtml(t) }} />);
    }
    // If text is a single string (but not the command echo case handled above), wrap it in a div
    return <div dangerouslySetInnerHTML={{ __html: formatTextForHtml(line.text as string) }} />;
  };

  return (
    <div className={`whitespace-pre-wrap break-words ${line.isError ? 'text-red-400' : ''}`}>
      {/* Render prompt if it exists and it's not part of a command echo (already handled) */}
      {line.prompt && !line.isCommand && (
        <span className="text-accent" dangerouslySetInnerHTML={{ __html: formatTextForHtml(line.prompt) }} />
      )}
      {renderContent()}
    </div>
  );
};

export default TerminalOutputLine;
