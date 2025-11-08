
import React, { useState, useRef, useEffect } from 'react';
import { Recipe, AiChatMessage } from '../types';
import { askAIAssistant } from '../services/geminiService';
import { AiIcon, SendIcon } from './icons';

interface AIAssistantProps {
  recipes: Recipe[];
}

const welcomeMessage: AiChatMessage = {
  role: 'model',
  text: `¡Bienvenido al Asistente IA de CostePro! Estoy aquí para ayudarte a optimizar tu restaurante.

Puedes preguntarme cosas como:
• "Analiza la rentabilidad de mi carta actual y dame sugerencias."
• "Sugiéreme un plato de temporada que use 'Pechuga de Pollo'."
• "¿Cuál es el food cost ideal para un entrante en mi tipo de restaurante?"
• "Dame 5 ideas creativas para postres."`
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ recipes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AiChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await askAIAssistant(input, recipes);
      const modelMessage: AiChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessageText = error instanceof Error ? error.message : String(error);
      console.error("Error asking AI assistant:", errorMessageText);
      const errorMessage: AiChatMessage = {
        role: 'model',
        text: 'Lo siento, ha ocurrido un error al contactar con la IA.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary-focus text-white rounded-full p-4 shadow-lg z-50 transition-transform hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <AiIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-lg h-[70vh] max-h-[600px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 text-white">
      <header className="flex items-center justify-between p-4 bg-slate-900 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <AiIcon />
          <h3 className="font-bold text-white">Asistente IA Gastronómico</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white font-bold">&times;</button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-xl ${
                  msg.role === 'user' ? 'bg-primary text-primary-content' : 'bg-slate-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-xl bg-slate-700 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta al asistente..."
            className="w-full bg-transparent p-3 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 text-primary disabled:text-gray-500">
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};
