import React, { useState, useRef, useEffect, useCallback } from 'react';
import { runQuery } from '../services/geminiService';
import { Query } from '../types';
import { ResponseDisplay } from './ResponseDisplay';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { ImageIcon, MicIcon, SendIcon, CloseIcon, HistoryIcon, LoadingSpinner, StopIcon, NewChatIcon } from './icons';

interface AssistantPopupProps {
  onClose: () => void;
}

export const AssistantPopup: React.FC<AssistantPopupProps> = ({ onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<Query[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCancelledRef = useRef(false);

  const { isListening, transcript, startListening, stopListening } = useSpeechToText({ continuous: true });

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    // Center the popup initially
    if (popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        setPosition({
            x: (window.innerWidth - rect.width) / 2,
            y: (window.innerHeight / 4), // Position it a bit higher
        });
    }
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !popupRef.current) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    isCancelledRef.current = false;
    setIsLoading(true);
    setResponse(null);
    setShowHistory(false);
    
    const queryResponse = await runQuery(prompt, image);

    if (isCancelledRef.current) {
        return;
    }
    
    const newQuery: Query = {
      id: Date.now().toString(),
      prompt,
      image,
      response: queryResponse,
      timestamp: new Date()
    };

    setHistory(prev => [newQuery, ...prev]);
    setResponse(queryResponse);
    setIsLoading(false);
    setPrompt('');
    setImage(undefined);
  };

  const handleStop = () => {
    isCancelledRef.current = true;
    setIsLoading(false);
    setResponse("Generation stopped by user.");
  };

  const handleNewChat = () => {
    setPrompt('');
    setImage(undefined);
    setResponse(null);
    setIsLoading(false);
    setShowHistory(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        event.preventDefault();
        break;
      }
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const loadFromHistory = (query: Query) => {
    setPrompt(query.prompt);
    setImage(query.image);
    setResponse(query.response);
    setShowHistory(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isExpanded = isLoading || response !== null || showHistory;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}>
      <div
        ref={popupRef}
        className={`fixed flex flex-col w-[90vw] max-w-2xl bg-white dark:bg-dark-surface shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border transition-all duration-300 ease-in-out ${
            isExpanded ? 'h-[70vh]' : 'h-auto'
        }`}
        style={{ left: `${position.x}px`, top: `${position.y}px`, transform: `translate(0,0)` }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 drag-handle cursor-move">
          <div className="flex items-center space-x-1">
            <button title="New Chat" onClick={handleNewChat} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                <NewChatIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary"/>
            </button>
            <button title="History" onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
              <HistoryIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary"/>
            </button>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 select-none">AI Assistant</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
            <CloseIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary"/>
          </button>
        </div>
        
        {isExpanded && (
          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {showHistory ? (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-dark-text">Query History</h2>
                <ul className="space-y-2">
                  {history.map(item => (
                    <li key={item.id} onClick={() => loadFromHistory(item)} className="p-3 rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                      <p className="truncate font-medium text-sm text-gray-700 dark:text-dark-text">{item.prompt}</p>
                      <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-1">{item.timestamp.toLocaleString()}</p>
                    </li>
                  ))}
                  {history.length === 0 && <p className="text-sm text-center text-gray-400 dark:text-dark-text-secondary py-4">No history yet.</p>}
                </ul>
              </div>
            ) : (
              isLoading ? 
              <div className="flex flex-col items-center justify-center h-full">
                <LoadingSpinner className="w-8 h-8 text-brand-blue" />
                <p className="mt-4 text-gray-500 dark:text-dark-text-secondary animate-subtle-pulse">Thinking...</p>
                <button 
                  onClick={handleStop}
                  className="mt-6 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:text-dark-text dark:bg-dark-border rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <StopIcon className="w-4 h-4 mr-2"/>
                  Stop
                </button>
              </div> 
              : response ? <ResponseDisplay response={response} /> : 
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <h2 className="text-2xl font-bold text-gray-700 dark:text-dark-text">How can I help?</h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">
                      Ask anything, upload an image, or use your voice.
                  </p>
              </div>
            )}
          </div>
        )}
        
        { !showHistory && (
          <div className="p-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface/50">
            <form onSubmit={handleSubmit} className="relative">
              {image && (
                <div className="mb-2 relative w-24 h-24 rounded-lg overflow-hidden">
                  <img src={image} alt="uploaded content" className="object-cover w-full h-full" />
                  <button onClick={() => setImage(undefined)} className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white">
                    <CloseIcon className="w-3 h-3"/>
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask anything..."
                className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg p-3 pr-28 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                rows={1}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
                </button>
                <button type="button" onClick={toggleMic} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border transition-colors ${isListening ? 'bg-red-500/20' : ''}`}>
                  <MicIcon className={`w-5 h-5 text-gray-500 dark:text-dark-text-secondary ${isListening ? 'text-red-500' : ''}`} />
                </button>
                <button type="submit" disabled={isLoading || !prompt.trim()} className="p-2 rounded-full bg-brand-blue text-white disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors">
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
