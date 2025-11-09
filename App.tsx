
import React, { useState, useEffect, useCallback } from 'react';
import { AssistantPopup } from './components/AssistantPopup';
import { Theme } from './types';
import { SunIcon, MoonIcon, GithubIcon } from './components/icons';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isAssistantVisible, setAssistantVisible] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      setAssistantVisible(prevState => !prevState);
    }
    if (e.key === 'Escape') {
      setAssistantVisible(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="w-screen h-screen bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text overflow-hidden font-sans">
      <div className="absolute top-4 right-4 flex items-center space-x-4 z-50">
        <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-dark-text-secondary hover:text-brand-blue dark:hover:text-brand-blue transition-colors">
          <GithubIcon className="w-6 h-6" />
        </a>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-dark-surface hover:bg-gray-300 dark:hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          AI Assistant Web
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl">
          This is a web simulation of an always-available AI assistant. Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl + Space</kbd> to activate the assistant.
        </p>
      </div>

      {isAssistantVisible && <AssistantPopup onClose={() => setAssistantVisible(false)} />}
    </div>
  );
};

export default App;
