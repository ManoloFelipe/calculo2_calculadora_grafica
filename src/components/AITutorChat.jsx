import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, HelpCircle, MessageSquare } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

export default function AITutorChat({ currentContext, onSendMessage, messages, isLoading }) {
  const [inputQuestion, setInputQuestion] = useState('');

  const quickQuestions = [
    '¿Por qué se eligió este método de integración y no otro?',
    '¿Cómo cambiaría la integral si rotara alrededor de la recta y = 5?',
    '¿Cuál es la interpretación física de las unidades u³ en este sólido?',
    'Explica paso a paso cómo se halló la antiderivada.',
    '¿Qué condiciones de continuidad debe cumplir la función en [a, b]?'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    onSendMessage(inputQuestion);
    setInputQuestion('');
  };

  const handleQuickClick = (q) => {
    if (isLoading) return;
    onSendMessage(q);
  };

  // Helper para renderizar texto que contiene notación matemática $...$
  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(\$[^$]+\$)/g);
    return (
      <div className="space-y-1">
        {parts.map((part, i) => {
          if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1);
            return <KatexMath key={i} math={math} block={false} className="text-cyan-300 font-semibold" />;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-[700px]">
      {/* Header del Tutor */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Tutor Virtual de Cálculo II
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-normal">
                Gemini AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Pregunta cualquier duda sobre el procedimiento, fórmulas o cambios de eje.
            </p>
          </div>
        </div>

        {/* Resumen del contexto actual */}
        <div className="hidden md:block text-right text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono">
          <span className="text-slate-500">Ejercicio activo: </span>
          <span className="text-cyan-300 font-semibold">f(x) = {currentContext.fStr}</span>
          <span className="text-slate-500"> en [{currentContext.a}, {currentContext.b}]</span>
        </div>
      </div>

      {/* Sugerencias de preguntas rápidas */}
      <div className="py-3 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Preguntas sugeridas sobre el ejercicio actual:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickClick(q)}
              disabled={isLoading}
              className="text-xs bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-all text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">¿Tienes dudas con este sólido de revolución?</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Escribe una pregunta abajo o selecciona una de las preguntas sugeridas para que el Tutor IA te explique detalladamente.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p>{msg.text}</p>
                ) : (
                  renderMessageContent(msg.text)
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>El tutor está formulando la explicación pedagógica...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input de Envío */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Escribe tu consulta sobre el ejercicio de Cálculo II..."
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuestion.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preguntar</span>
        </button>
      </form>
    </div>
  );
}
