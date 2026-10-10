import React from 'react';
import { Sparkles, CheckCircle2, Calculator, Info, Lightbulb, Compass, Award } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

export default function StepByStepSolution({ explanation, numRef }) {
  if (!explanation) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Encabezado y Badge de IA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Solución Pedagógica Paso a Paso
            </span>
            {explanation.isAiGenerated ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-gradient-to-r from-purple-950 to-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Generado por Gemini AI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                <Calculator className="w-3 h-3 text-cyan-400" /> Solución Analítica Estándar
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {explanation.methodTitle || 'Resolución del Ejercicio'}
          </h2>
        </div>

        {/* Banner de Resultado Final */}
        <div className="bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-800/80 rounded-xl p-3 text-right">
          <div className="text-[11px] font-medium text-cyan-300 flex items-center justify-end gap-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" /> Resultado Final
          </div>
          <div className="text-lg font-bold text-white">
            <KatexMath math={explanation.exactResult || `${numRef?.formatted} ${numRef?.units}`} />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            ≈ {explanation.decimalResult || `${numRef?.formatted} ${numRef?.units}`}
          </div>
        </div>
      </div>

      {/* Tarjeta de Verificación de Continuidad y Justificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Condición de Continuidad</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.continuityStatus}
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Justificación del Método</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.methodJustification}
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
          <KatexMath math={explanation.integralLatex} block={true} className="text-base sm:text-lg text-cyan-200" />
        </div>
      </div>

      {/* Desglose de Pasos Numerados */}
      {explanation.steps && explanation.steps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Desarrollo Matemático Detallado</span>
          </h3>

          <div className="space-y-3">
            {explanation.steps.map((st, idx) => (
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
                      {st.description}
                    </p>
                    {st.mathFormula && (
                      <div className="mt-2 py-1.5 px-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center overflow-x-auto">
                        <KatexMath math={st.mathFormula} block={true} className="text-cyan-200 text-sm" />
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
      {explanation.realWorldInsight && (
        <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/40 to-slate-950 border border-cyan-900/50 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-cyan-900/40 text-cyan-300 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
              Aplicación Práctica en Ingeniería
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {explanation.realWorldInsight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
