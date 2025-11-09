
import React, { useState, useEffect, FC, PropsWithChildren } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyIcon, CheckIcon } from './icons';

interface ResponseDisplayProps {
  response: string;
}

const CodeBlock: FC<PropsWithChildren<{ className?: string }>> = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'text';
  const textToCopy = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative my-4 rounded-lg bg-[#1e1e1e] group">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-4 h-4"/>}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
        wrapLongLines={true}
      >
        {textToCopy}
      </SyntaxHighlighter>
    </div>
  );
};


export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
    const [displayedResponse, setDisplayedResponse] = useState('');

    useEffect(() => {
        setDisplayedResponse('');
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < response.length) {
                setDisplayedResponse(prev => prev + response.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 10);
        return () => clearInterval(typingInterval);
    }, [response]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-800 dark:prose-p:text-dark-text prose-headings:text-gray-900 dark:prose-headings:text-dark-text">
            <ReactMarkdown
                components={{
                    code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
                        ) : (
                            <code className="px-1.5 py-1 bg-gray-200 dark:bg-dark-bg rounded-md font-mono" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {displayedResponse}
            </ReactMarkdown>
        </div>
    );
};
