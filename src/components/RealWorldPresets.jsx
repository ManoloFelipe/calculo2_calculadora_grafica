import React from 'react';
import { BookOpen, ArrowRight, Factory, Building2, Flame, Wrench } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

export default function RealWorldPresets({ presets, onSelectPreset }) {
  const getCategoryIcon = (category) => {
    if (category.includes('Industrial') || category.includes('Manufactura')) {
      return <Factory className="w-4 h-4 text-cyan-400" />;
    }
    if (category.includes('Civil') || category.includes('Arquitectura')) {
      return <Building2 className="w-4 h-4 text-emerald-400" />;
    }
    if (category.includes('Física') || category.includes('Mediciones')) {
      return <Flame className="w-4 h-4 text-amber-400" />;
    }
    return <Wrench className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Módulo de Aplicaciones Prácticas</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Casos Reales de Ingeniería y Ciencias Aplicadas
        </h2>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Los sólidos de revolución y las integrales definidas son fundamentales para determinar volúmenes, capacidades, cargas muertas y resistencia de materiales. Selecciona una plantilla preconfigurada para modelar y calcular el sólido en 3D.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:shadow-cyan-500/10"
          >
            <div>
              {/* Categoría y Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  {getCategoryIcon(preset.category)}
                  <span>{preset.category}</span>
                </span>
                <span className="text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  {preset.badge}
                </span>
              </div>

              {/* Título y descripción */}
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                {preset.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {preset.description}
              </p>

              {/* Caja de contexto del problema */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300 block mb-1">Escenario de Ingeniería:</strong>
                {preset.scenario}
              </div>

              {/* Datos matemáticos */}
              <div className="space-y-1.5 py-2 px-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs text-slate-300 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">f(x):</span>
                  <span className="text-cyan-300 font-semibold">{preset.fStr}</span>
                </div>
                {preset.gStr && preset.gStr !== '0' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">g(x):</span>
                    <span className="text-amber-300 font-semibold">{preset.gStr}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Intervalo [a, b]:</span>
                  <span className="text-slate-200">[{preset.a}, {preset.b}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Eje de giro:</span>
                  <span className="text-slate-200">
                    {preset.axisType === 'horizontal' ? `y = ${preset.axisVal}` : `x = ${preset.axisVal}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unidades de salida:</span>
                  <span className="text-emerald-400 font-semibold">{preset.unitLabel}</span>
                </div>
              </div>
            </div>

            {/* Botón de Cargar */}
            <button
              onClick={() => onSelectPreset(preset)}
              className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-300 font-semibold text-xs rounded-xl border border-slate-700 hover:border-cyan-500 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
            >
              <span>Cargar en Calculadora y Graficar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
