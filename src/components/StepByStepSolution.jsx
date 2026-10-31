import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Calculator, Info, Lightbulb, Compass, Award, Layers, RotateCw } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

// Helper para renderizar texto que contiene notación matemática $...$
const renderMathText = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <KatexMath key={i} math={math} block={false} className="text-cyan-300 font-semibold" />;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function StepByStepSolution({ explanation, numRef }) {
  if (!explanation) return null;

  const [activeTab, setActiveTab] = useState('volume');

  // Si existe procedimiento de área secundario y se selecciona la pestaña de área, mostrarlo
  const hasAreaProc = Boolean(explanation.areaProcedure);
  const currentData = (activeTab === 'area' && hasAreaProc) ? explanation.areaProcedure : explanation;
  const isAreaActive = activeTab === 'area' || explanation.mode === 'area';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Encabezado y Badges de Solución */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Procedimiento Matemático Completo
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full">
              <Calculator className="w-3 h-3 text-cyan-400" /> Solución Analítica Rigurosa
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {currentData.methodTitle || 'Resolución del Ejercicio'}
          </h2>
        </div>

        {/* Banners de Resultados Finales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tarjeta de Volumen (si no es modo área exclusivo) */}
          {explanation.mode !== 'area' && (
            <div className="bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-800/80 rounded-xl p-3 text-right">
              <div className="text-[11px] font-medium text-cyan-300 flex items-center justify-end gap-1">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Volumen Sólido (3D)
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                <KatexMath math={explanation.exactResult || `${numRef?.formatted} ${numRef?.units}`} />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ≈ {explanation.decimalResult || `${numRef?.formatted} ${numRef?.units}`}
              </div>
            </div>
          )}

          {/* Tarjeta de Área */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border border-indigo-800/80 rounded-xl p-3 text-right">
            <div className="text-[11px] font-medium text-indigo-300 flex items-center justify-end gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Área Región (2D)
            </div>
            <div className="text-base sm:text-lg font-bold text-white">
              <KatexMath math={hasAreaProc ? explanation.areaProcedure.exactResult : explanation.exactResult} />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              ≈ {hasAreaProc ? explanation.areaProcedure.decimalResult : explanation.decimalResult}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas entre Procedimiento de Volumen y Procedimiento de Área */}
      {hasAreaProc && (
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('volume')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'volume'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Procedimiento de Volumen (3D)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('area')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'area'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Procedimiento de Área (2D)</span>
          </button>
        </div>
      )}

      {/* Tarjeta de Verificación de Continuidad y Justificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Condición de Continuidad</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {renderMathText(currentData.continuityStatus)}
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Justificación del Método</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {renderMathText(currentData.methodJustification)}
          </p>
        </div>
      </div>

      {/* Planteamiento Formal de la Integral */}
      <div className="bg-slate-950 border border-cyan-950/60 rounded-xl p-4 shadow-inner">
        <div className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Planteamiento Formal de la Integral Definida</span>
        </div>
        <div className="py-2 px-3 bg-slate-900/60 rounded-lg border border-slate-800 text-center overflow-x-auto">
          <KatexMath math={currentData.integralLatex} block={true} className="text-base sm:text-lg text-cyan-200" />
        </div>
      </div>

      {/* Tarjeta de Evaluación de Barrow Detallada si existe */}
      {currentData.barrowDetails && (
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/40 border border-cyan-800/50 rounded-xl p-4 shadow-lg space-y-3">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Evaluación del Teorema Fundamental del Cálculo (Regla de Barrow)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-400 font-mono mb-1">Límite Superior x = {currentData.barrowDetails.upperLimit}</div>
              <KatexMath math={`F(${currentData.barrowDetails.upperLimit}) = ${currentData.barrowDetails.fUpperStr}`} block={true} className="text-cyan-200 text-xs font-semibold" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-400 font-mono mb-1">Límite Inferior x = {currentData.barrowDetails.lowerLimit}</div>
              <KatexMath math={`F(${currentData.barrowDetails.lowerLimit}) = ${currentData.barrowDetails.fLowerStr}`} block={true} className="text-cyan-200 text-xs font-semibold" />
            </div>
            <div className="bg-slate-900/80 border border-cyan-900/80 rounded-lg p-2.5">
              <div className="text-[10px] text-cyan-300 font-mono mb-1">Diferencia Barrow ΔF</div>
              <KatexMath math={`\\Delta F = ${currentData.barrowDetails.deltaFStr}`} block={true} className="text-cyan-300 text-xs font-bold" />
            </div>
          </div>
        </div>
      )}

      {/* Desglose de Pasos Numerados del Procedimiento */}
      {currentData.steps && currentData.steps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              {isAreaActive ? 'Desarrollo Matemático del Área Paso a Paso' : 'Desarrollo Matemático del Volumen Paso a Paso'} ({currentData.steps.length} Pasos)
            </span>
          </h3>

          <div className="space-y-3">
            {currentData.steps.map((st, idx) => (
              <div
                key={st.stepNumber || idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {st.stepNumber || idx + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h4 className="text-xs font-semibold text-white">
                      {st.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {renderMathText(st.description)}
                    </p>
                    {st.mathFormula && (
                      <div className="mt-2 py-1.5 px-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center overflow-x-auto">
                        <KatexMath math={st.mathFormula} block={true} className="text-cyan-200 text-sm" />
                      </div>
                    )}
                    {st.secondaryFormula && (
                      <div className="mt-1.5 py-1 px-3 bg-slate-900/40 rounded-lg border border-slate-800/60 text-center overflow-x-auto">
                        <KatexMath math={st.secondaryFormula} block={true} className="text-cyan-300 text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aplicación Práctica en Ingeniería */}
      {currentData.realWorldInsight && (
        <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/40 to-slate-950 border border-cyan-900/50 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-cyan-900/40 text-cyan-300 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
              Aplicación Práctica en Ingeniería
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {renderMathText(currentData.realWorldInsight)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
