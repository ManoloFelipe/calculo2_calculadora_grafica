import React from 'react';
import { Box, Sparkles, BookOpen, Layers, HelpCircle, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenGuide, apiHealth }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
              <Box className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  Cálculo<span className="text-cyan-400">App</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> IA Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sólidos de Revolución y Áreas · Cálculo II (Ing. Sistemas)
              </p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calculator'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Calculadora y Gráficas</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Casos de la Vida Real</span>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tutor'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Tutor IA</span>
            </button>
          </nav>

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all"
              title="Guía teórica de métodos"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Guía de Fórmulas</span>
            </button>

            {/* Badge de estado del servidor */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-slate-800/50 border border-slate-700/60 text-slate-400">
              <Activity className={`w-3 h-3 ${apiHealth ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{apiHealth ? 'Backend Conectado' : 'Conectando...'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
