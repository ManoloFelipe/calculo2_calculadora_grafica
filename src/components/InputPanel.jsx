import React, { useState } from 'react';
import { Play, Sparkles, RotateCw, HelpCircle, Layers, Sliders } from 'lucide-react';
import KatexMath from './KatexMath.jsx';

export default function InputPanel({
  formState,
  setFormState,
  onCalculate,
  isLoading
}) {
  const [activeInput, setActiveInput] = useState('fStr');

  const mathKeys = [
    { label: 'x²', val: '^2' },
    { label: '√x', val: 'sqrt(x)' },
    { label: 'x³', val: '^3' },
    { label: 'sin(x)', val: 'sin(x)' },
    { label: 'cos(x)', val: 'cos(x)' },
    { label: 'eˣ', val: 'exp(x)' },
    { label: 'ln(x)', val: 'log(x)' },
    { label: 'π', val: 'pi' },
    { label: '1/x', val: '1/x' },
    { label: '·', val: '*' },
    { label: '( )', val: '()' }
  ];

  const handleKeyInsert = (val) => {
    setFormState(prev => {
      const current = prev[activeInput] || '';
      return {
        ...prev,
        [activeInput]: current + val
      };
    });
  };

  const handleAxisPreset = (type, val) => {
    setFormState(prev => ({
      ...prev,
      axisType: type,
      axisVal: val
    }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Selector de Modo: Sólido vs Área */}
      <div className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
        <button
          type="button"
          onClick={() => setFormState(prev => ({ ...prev, mode: 'solid' }))}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            formState.mode === 'solid'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Sólidos de Revolución (3D)
        </button>
        <button
          type="button"
          onClick={() => setFormState(prev => ({ ...prev, mode: 'area' }))}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            formState.mode === 'area'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Área bajo la Curva (2D)
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onCalculate(); }} className="space-y-4">
        {/* Input f(x) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
            <span>Función principal <span className="text-cyan-400">f(x)</span></span>
            <span className="text-[11px] text-slate-500 font-normal">ej. sqrt(x), x^2, sin(x)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formState.fStr}
              onChange={(e) => setFormState({ ...formState, fStr: e.target.value })}
              onFocus={() => setActiveInput('fStr')}
              placeholder="x^2"
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-cyan-200 font-mono tracking-wide placeholder-slate-600"
              required
            />
          </div>
        </div>

        {/* Input g(x) opcional */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
            <span>Segunda curva <span className="text-amber-400">g(x)</span> (opcional)</span>
            <span className="text-[11px] text-slate-500 font-normal">Para arandelas o área entre curvas</span>
          </label>
          <input
            type="text"
            value={formState.gStr}
            onChange={(e) => setFormState({ ...formState, gStr: e.target.value })}
            onFocus={() => setActiveInput('gStr')}
            placeholder="0"
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2 text-sm text-amber-200 font-mono tracking-wide placeholder-slate-600"
          />
        </div>

        {/* Teclado matemático rápido */}
        <div>
          <div className="text-[11px] text-slate-400 mb-1">Insertar en <span className="text-cyan-400 font-mono">{activeInput}</span>:</div>
          <div className="flex flex-wrap gap-1.5">
            {mathKeys.map(k => (
              <button
                key={k.label}
                type="button"
                onClick={() => handleKeyInsert(k.val)}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-mono border border-slate-700/50 hover:border-slate-600 transition-colors"
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Límites de Integración [a, b] */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Límite inferior <span className="text-cyan-400 font-mono">a</span>
            </label>
            <input
              type="number"
              step="any"
              value={formState.a}
              onChange={(e) => setFormState({ ...formState, a: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Límite superior <span className="text-cyan-400 font-mono">b</span>
            </label>
            <input
              type="number"
              step="any"
              value={formState.b}
              onChange={(e) => setFormState({ ...formState, b: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white font-mono"
              required
            />
          </div>
        </div>

        {/* Parámetros específicos de Sólidos */}
        {formState.mode === 'solid' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Eje de Giro */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Eje de Rotación
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => handleAxisPreset('horizontal', 0)}
                  className={`py-1.5 px-2 text-xs rounded-lg font-mono border transition-all ${
                    formState.axisType === 'horizontal' && Number(formState.axisVal) === 0
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Eje X (y=0)
                </button>
                <button
                  type="button"
                  onClick={() => handleAxisPreset('vertical', 0)}
                  className={`py-1.5 px-2 text-xs rounded-lg font-mono border transition-all ${
                    formState.axisType === 'vertical' && Number(formState.axisVal) === 0
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Eje Y (x=0)
                </button>
                <button
                  type="button"
                  onClick={() => setFormState(p => ({ ...p, axisType: 'horizontal' }))}
                  className={`py-1.5 px-2 text-xs rounded-lg font-mono border transition-all ${
                    formState.axisType === 'horizontal' && Number(formState.axisVal) !== 0
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recta y = c
                </button>
                <button
                  type="button"
                  onClick={() => setFormState(p => ({ ...p, axisType: 'vertical' }))}
                  className={`py-1.5 px-2 text-xs rounded-lg font-mono border transition-all ${
                    formState.axisType === 'vertical' && Number(formState.axisVal) !== 0
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recta x = k
                </button>
              </div>

              {/* Valor del eje si es recta arbitraria */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  {formState.axisType === 'horizontal' ? 'Eje horizontal y =' : 'Eje vertical x ='}
                </span>
                <input
                  type="number"
                  step="any"
                  value={formState.axisVal}
                  onChange={(e) => setFormState({ ...formState, axisVal: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Selector de Método */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                <span>Método de Cálculo</span>
                <span className="text-[11px] text-cyan-400">Recomendado: Automático</span>
              </label>
              <select
                value={formState.method}
                onChange={(e) => setFormState({ ...formState, method: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium"
              >
                <option value="auto">Automático (Decidido por IA según el eje y curvas)</option>
                <option value="discos">Método de Discos (Secciones circulares macizas)</option>
                <option value="arandelas">Método de Arandelas (Discos con perforación central)</option>
                <option value="capas">Método de Capas Cilíndricas (Cascarones concéntricos)</option>
              </select>
            </div>
          </div>
        )}

        {/* Botón de Cálculo */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Calculando y consultando a Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Calcular y Resolver con IA</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
