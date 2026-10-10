import React from 'react';
import { X, BookOpen, Layers, RotateCw, CheckCircle2 } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

export default function FormulaGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Guía Rápida de Métodos: Sólidos de Revolución y Áreas
            </h3>
            <p className="text-xs text-slate-400">
              Formulario oficial y criterios de selección para Cálculo II
            </p>
          </div>
        </div>

        {/* Contenido Teórico */}
        <div className="space-y-6 text-xs text-slate-300">
          {/* Método 1: Discos */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <RotateCw className="w-4 h-4" /> 1. Método de Discos (Sección Circular Maciza)
              </h4>
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded text-[10px]">
                Sin hueco interior
              </span>
            </div>
            <p className="leading-relaxed mb-3">
              Se utiliza cuando la región plana generadora está pegada al eje de giro y el elemento diferencial de área es <strong>perpendicular</strong> al eje de rotación.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Giro alrededor del Eje X (y = 0):</span>
                <KatexMath math="V = \pi \int_a^b [f(x)]^2 \, dx" block={true} className="text-cyan-200" />
              </div>
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Giro alrededor de una recta y = c:</span>
                <KatexMath math="V = \pi \int_a^b [f(x) - c]^2 \, dx" block={true} className="text-cyan-200" />
              </div>
            </div>
          </div>

          {/* Método 2: Arandelas */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <RotateCw className="w-4 h-4" /> 2. Método de Arandelas (Discos Huecos)
              </h4>
              <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                Con perforación o dos curvas
              </span>
            </div>
            <p className="leading-relaxed mb-3">
              Se utiliza cuando el sólido posee un hueco interno delimitado por una curva interior $r(x)$ y una curva exterior $R(x)$.
            </p>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-400 block mb-1">Fórmula general:</span>
              <KatexMath math="V = \pi \int_a^b \left( [R(x)]^2 - [r(x)]^2 \right) \, dx" block={true} className="text-amber-200" />
            </div>
          </div>

          {/* Método 3: Capas Cilíndricas */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 3. Método de Capas Cilíndricas (Cascarones)
              </h4>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                Franja paralela al eje
              </span>
            </div>
            <p className="leading-relaxed mb-3">
              Se utiliza cuando el elemento diferencial es <strong>paralelo</strong> al eje de rotación. Es especialmente útil al rotar en torno al <strong>Eje Y (x=0)</strong> integrando respecto a $x$, evitando tener que despejar $x$ en función de $y$.
            </p>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-400 block mb-1">Giro alrededor de una recta vertical x = k:</span>
              <KatexMath math="V = 2\pi \int_a^b p(x) \cdot h(x) \, dx" block={true} className="text-emerald-200" />
              <div className="text-[11px] text-slate-400 mt-2">
                Donde $p(x) = |x - k|$ es el radio medio cilíndrico y $h(x) = f(x) - g(x)$ es la altura del cilindro.
              </div>
            </div>
          </div>

          {/* Área bajo la curva */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-sm text-blue-300 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 4. Área entre Curvas y Teorema Fundamental
            </h4>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <KatexMath math="A = \int_a^b [f(x) - g(x)] \, dx = \left[ F(x) - G(x) \right]_a^b" block={true} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Botón Entendido */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
}
