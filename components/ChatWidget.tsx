
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Message, Resource, ChatContext } from '../types';
import { getChatResponse } from '../services/chatService';
import { ALL_RESOURCES, HMC_PROGRAMS, FEATURED_PARTNERS } from '../constants';

const allDirectoryResources = [...HMC_PROGRAMS, ...FEATURED_PARTNERS, ...ALL_RESOURCES];

interface ChatWidgetProps {
  onResourceClick: (resource: Resource) => void;
  initialContext: ChatContext | null;
  onContextHandled: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onResourceClick, initialContext, onContextHandled, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const hmcLogoUrl = "https://cdn.prod.website-files.com/67359e6040140078962e8a54/6912e29e5710650a4f45f53f_Untitled%20(256%20x%20256%20px).png";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (initialContext) {
      setIsLoading(true);
      setMessages([]); // Clear previous messages for the new context
      
      const contextMessageContent = `INTERNAL_CONTEXT: The user has completed the Resource Navigator. Identified needs: ${initialContext.needs.join(', ')}. Recommended resource IDs: ${initialContext.recommendations.join(', ')}. Please provide a warm, empathetic welcome acknowledging these needs and present the recommended resources, then ask how you can help them explore these options.`;
      
      const contextMessage: Message = { id: 'context', sender: 'user', content: contextMessageContent };
      
      getChatResponse([contextMessage]).then(botResponseContent => {
        const botMessage: Message = { id: `bot-context-${Date.now()}`, sender: 'bot', content: botResponseContent };
        setMessages([botMessage]);
      }).catch(error => {
        const errorMessage: Message = { id: `err-${Date.now()}`, sender: 'bot', content: "Sorry, I'm having trouble connecting. Please try again." };
        setMessages([errorMessage]);
      }).finally(() => {
        setIsLoading(false);
        onContextHandled(); // Clear the context in the parent component
      });
    }
  }, [initialContext]);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && messages.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages([
          { id: 'init', sender: 'bot', content: "Hi there! I'm Sunny, and I'm here to help you find the support and healing you need." }
        ]);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', content: inputValue.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const botResponseContent = await getChatResponse(newMessages);
      const botMessage: Message = { id: `bot-${Date.now()}`, sender: 'bot', content: botResponseContent };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { id: `err-${Date.now()}`, sender: 'bot', content: "Sorry, I'm having trouble connecting. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceLinkClick = (resourceId: string) => {
    const resource = allDirectoryResources.find(r => r.id === resourceId);
    if (resource) {
      onResourceClick(resource);
    }
  };

  const renderMessageContent = (content: string): React.ReactNode => {
    const parseInlineFormatting = (text: string) => {
        const regex = /(\[([^\]]+)\]\(resource:\/\/([^\)]+)\))|((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)|(\*\*(.*?)\*\*)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            const key = `${match.index}-${lastIndex}`;
            if (match[1]) { // Resource link
                const [, , linkText, resourceId] = match;
                parts.push(
                    <button key={key} onClick={(e) => { e.preventDefault(); handleResourceLinkClick(resourceId); }} className="font-bold text-[#233dff] hover:underline bg-[#233dff]/10 px-1 py-0.5 rounded-md transition-colors inline-block">
                        {linkText}
                    </button>
                );
            } else if (match[4]) { // HTTP link
                const url = match[4];
                parts.push(<a href={url} key={key} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>);
            } else if (match[5]) { // Bold text
                const boldText = match[7];
                parts.push(<strong key={key}>{boldText}</strong>);
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        return parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
    };

    const blocks = content.split('\n\n');
    
    return blocks.map((block, blockIndex) => {
        const lines = block.split('\n');
        const isList = lines.every(line => line.trim().startsWith('* '));

        if (isList && lines.length > 0) {
            return (
                <ul key={blockIndex} className="list-disc pl-5 space-y-1 my-2">
                    {lines.map((line, lineIndex) => (
                        <li key={lineIndex}>{parseInlineFormatting(line.trim().substring(2))}</li>
                    ))}
                </ul>
            );
        }

        return (
            <p key={blockIndex} className="my-1">
                {lines.map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                        {parseInlineFormatting(line)}
                        {lineIndex < lines.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </p>
        );
    });
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[999] w-16 h-16 rounded-full bg-[#233dff] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 border-2 border-black"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[998] w-[calc(100vw-3rem)] max-w-sm h-[600px] bg-white rounded-2xl border border-[#e8e6e3] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <header className="p-4 bg-[#233dff] text-white flex items-center gap-3">
            <div className="relative">
              <img src={hmcLogoUrl} alt="HMC Logo" className="w-12 h-12 rounded-full border-2 border-white ring-1 ring-black bg-white object-contain" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Sunny Harper</h3>
              <p className="text-xs text-white/80">AI Resource Navigator</p>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <img src={hmcLogoUrl} alt="Sunny avatar" className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-black bg-white object-contain flex-shrink-0" />}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl prose prose-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#233dff] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                 <img src={hmcLogoUrl} alt="Sunny avatar" className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-black bg-white object-contain flex-shrink-0" />
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="p-3 bg-white border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask for help..."
                className="flex-1 bg-gray-100 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#233dff]/50 transition-all"
              />
              <button type="submit" disabled={!inputValue.trim() || isLoading} className="w-10 h-10 rounded-full bg-[#233dff] text-white border border-[#233dff] flex items-center justify-center disabled:opacity-50 transition-all">
                <Send size={20} />
              </button>
            </form>
          </footer>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
