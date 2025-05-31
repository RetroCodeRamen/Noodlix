'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface TerminalInputProps {
  prompt: string;
  onSubmit: (command: string) => void;
  onCommandHistory: (direction: 'up' | 'down') => string; // Returns command from history
  getSuggestions: (partialCommand: string) => string[];
}

const TerminalInput: React.FC<TerminalInputProps> = ({ prompt, onSubmit, onCommandHistory, getSuggestions }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim() === '') {
      setSuggestions([]);
      setSuggestionIndex(-1);
    } else {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setSuggestionIndex(newSuggestions.length > 0 ? 0 : -1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() !== '') {
        onSubmit(inputValue);
      } else {
        onSubmit(''); // submit empty line to get new prompt
      }
      setInputValue('');
      setSuggestions([]);
      setSuggestionIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmd = onCommandHistory('up');
      setInputValue(cmd);
      // Move cursor to end
      setTimeout(() => inputRef.current?.setSelectionRange(cmd.length, cmd.length), 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmd = onCommandHistory('down');
      setInputValue(cmd);
      setTimeout(() => inputRef.current?.setSelectionRange(cmd.length, cmd.length), 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestionIndex !== -1) {
        const currentSuggestion = suggestions[suggestionIndex];
        // If input is already the full suggestion, try to complete further (e.g., add a space if it's a command)
        if (inputValue === currentSuggestion && !currentSuggestion.endsWith(' ')) {
            setInputValue(currentSuggestion + ' ');
        } else {
            setInputValue(currentSuggestion);
        }
        setSuggestions([]); // Clear suggestions after tab completion
        setSuggestionIndex(-1);
      } else if (suggestions.length === 0 && inputValue.trim() !== '') {
        // If no suggestions visible but there might be one based on current input
        const newSuggestions = getSuggestions(inputValue);
        if (newSuggestions.length > 0) {
            setInputValue(newSuggestions[0]); // Auto-complete with the first suggestion
        }
      }
    }
  };

  return (
    <div className="flex items-center w-full">
      <span className="text-accent flex-shrink-0">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-grow bg-transparent text-foreground focus:outline-none pl-2 font-code"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {/* Basic suggestion display, can be improved */}
      {suggestions.length > 0 && suggestionIndex !== -1 && (
        <span className="absolute bottom-full left-0 mb-1 p-1 bg-popover text-popover-foreground border border-border rounded text-xs">
          {suggestions[suggestionIndex]}
        </span>
      )}
    </div>
  );
};

export default TerminalInput;
