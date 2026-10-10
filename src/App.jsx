import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import InputPanel from './components/InputPanel.jsx';
import Plot2D from './components/Plot2D.jsx';
import Plot3D from './components/Plot3D.jsx';
import StepByStepSolution from './components/StepByStepSolution.jsx';
import RealWorldPresets from './components/RealWorldPresets.jsx';
import AITutorChat from './components/AITutorChat.jsx';
import FormulaGuideModal from './components/FormulaGuideModal.jsx';
import { AlertCircle, RotateCcw, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [apiHealth, setApiHealth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Parámetros del Formulario
  const [formState, setFormState] = useState({
    mode: 'solid',
    fStr: 'sqrt(x)',
    gStr: '0',
    a: 0,
    b: 4,
    axisType: 'horizontal',
    axisVal: 0,
    method: 'auto'
  });

  const [angle3D, setAngle3D] = useState(360);
  const [calcResult, setCalcResult] = useState(null);
  const [presets, setPresets] = useState([]);
  const [tutorMessages, setTutorMessages] = useState([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Asistente de Cálculo II. Puedes consultarme cualquier duda sobre el planteamiento de la integral, la justificación geométrica del método o cómo cambiar el eje de rotación.'
    }
  ]);

  // Base URL dinámica para subcarpetas (ej. /calculo2/api)
  const API_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/api';

  // Chequeo de salud del API y carga de presets al iniciar
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setApiHealth(true);
      })
      .catch(() => setApiHealth(false));

    fetch(`${API_BASE}/presets`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.presets) {
          setPresets(data.presets);
        }
      })
      .catch(err => console.warn('No se pudieron cargar presets:', err));

    // Ejecutar cálculo inicial para que la vista arranque con un ejemplo interactivo
    executeCalculation(formState, 360);
  }, []);

  // Función principal de cálculo
  const executeCalculation = async (stateToUse = formState, currentAngle = angle3D) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_BASE}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stateToUse,
          maxAngleDeg: currentAngle
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el cálculo');
      }

      setCalcResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador del slider de ángulo 3D
  const handleAngleChange = (newAngle) => {
    setAngle3D(newAngle);
    executeCalculation(formState, newAngle);
  };

  // Selección de una plantilla preconfigurada
  const handleSelectPreset = (preset) => {
    const newState = {
      mode: preset.mode || 'solid',
      fStr: preset.fStr,
      gStr: preset.gStr || '0',
      a: preset.a,
      b: preset.b,
      axisType: preset.axisType || 'horizontal',
      axisVal: preset.axisVal || 0,
      method: preset.method || 'auto'
    };
    setFormState(newState);
    setActiveTab('calculator');
    executeCalculation(newState, angle3D);
  };

  // Envío de preguntas al Tutor IA
  const handleSendTutorMessage = async (question) => {
    const userMsg = { sender: 'user', text: question };
    setTutorMessages(prev => [...prev, userMsg]);
    setIsTutorLoading(true);

    try {
      const response = await fetch(`${API_BASE}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            ...formState,
            decimalResult: calcResult?.numRef?.formatted
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo contactar al tutor');
      }

      setTutorMessages(prev => [
        ...prev,
        { sender: 'ai', text: data.reply }
      ]);
    } catch (err) {
      setTutorMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ No se pudo obtener respuesta del tutor: ${err.message}`
        }
      ]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        apiHealth={apiHealth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notificación de Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800 rounded-2xl flex items-center gap-3 text-red-200 text-sm shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs bg-red-900/60 hover:bg-red-800 px-3 py-1 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Pestaña: Calculadora y Gráficas */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Panel Superior: Entrada a la izquierda, Gráficos a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Formulario de Entrada */}
              <div className="lg:col-span-4">
                <InputPanel
                  formState={formState}
                  setFormState={setFormState}
                  onCalculate={() => executeCalculation(formState, angle3D)}
                  isLoading={isLoading}
                />
              </div>

              {/* Panel de Gráficos (2D y 3D) */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[440px]">
                {/* Gráfico 2D */}
                <Plot2D
                  plotData={calcResult?.plot2D}
                  title="1. Región Plana Generadora (2D)"
                />

                {/* Gráfico 3D (para sólidos) o vista extendida si es sólo área */}
                {formState.mode === 'solid' ? (
                  <Plot3D
                    meshData={calcResult?.mesh3D}
                    title="2. Sólido de Revolución Generado (3D)"
                    onAngleChange={handleAngleChange}
                    currentAngle={angle3D}
                  />
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
                    <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Modo Área bajo la Curva Activo</h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                      Estás calculando el área plana entre los límites [{formState.a}, {formState.b}]. Cambia a "Sólidos de Revolución (3D)" para visualizar la rotación completa de 360°.
                    </p>
                    <button
                      onClick={() => {
                        setFormState(p => ({ ...p, mode: 'solid' }));
                        executeCalculation({ ...formState, mode: 'solid' }, angle3D);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold rounded-xl hover:from-cyan-500 hover:to-blue-500 shadow-md transition-all"
                    >
                      Activar Generación 3D
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel Inferior: Solución Paso a Paso con KaTeX */}
            <StepByStepSolution
              explanation={calcResult?.explanation}
              numRef={calcResult?.numRef}
            />
          </div>
        )}

        {/* Pestaña: Casos de la Vida Real */}
        {activeTab === 'presets' && (
          <RealWorldPresets
            presets={presets}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {/* Pestaña: Tutor Virtual IA */}
        {activeTab === 'tutor' && (
          <AITutorChat
            currentContext={formState}
            onSendMessage={handleSendTutorMessage}
            messages={tutorMessages}
            isLoading={isTutorLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Calculo App · Sólidos de Revolución con IA (Google Gemini) · Pregrado en Ingeniería en Sistemas
          </div>
          <div>
            Desplegable en Azure Virtual Machine (Ubuntu + PM2)
          </div>
        </div>
      </footer>

      {/* Modal de Guía de Fórmulas */}
      <FormulaGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
