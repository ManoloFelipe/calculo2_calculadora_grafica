import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Box, RotateCcw, Sliders, Palette, Grid } from 'lucide-react';

export default function Plot3D({
  meshData,
  title = 'Sólido de Revolución en 3D',
  onAngleChange,
  currentAngle = 360
}) {
  const containerRef = useRef(null);
  const [colorscale, setColorscale] = useState('Viridis');
  const [opacity, setOpacity] = useState(0.9);
  const [showWireframe, setShowWireframe] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !meshData || !meshData.outer) return;

    const traces = [];

    // Superficie Exterior
    traces.push({
      type: 'surface',
      x: meshData.outer.X,
      y: meshData.outer.Y,
      z: meshData.outer.Z,
      colorscale: colorscale,
      opacity: opacity,
      showscale: false,
      name: 'Superficie Exterior',
      contours: {
        x: { show: showWireframe, color: '#38bdf8', width: 1 },
        y: { show: showWireframe, color: '#38bdf8', width: 1 },
        z: { show: showWireframe, color: '#38bdf8', width: 1 }
      },
      lighting: {
        ambient: 0.7,
        diffuse: 0.8,
        specular: 0.4,
        roughness: 0.5
      }
    });

    // Superficie Interior (si existe en método de arandelas)
    if (meshData.inner && meshData.inner.X) {
      traces.push({
        type: 'surface',
        x: meshData.inner.X,
        y: meshData.inner.Y,
        z: meshData.inner.Z,
        colorscale: 'Plasma',
        opacity: Math.max(0.4, opacity * 0.8),
        showscale: false,
        name: 'Núcleo Interior (Hueco)',
        contours: {
          x: { show: showWireframe, color: '#f43f5e', width: 1 },
          y: { show: showWireframe, color: '#f43f5e', width: 1 },
          z: { show: showWireframe, color: '#f43f5e', width: 1 }
        }
      });
    }

    const layout = {
      margin: { l: 0, r: 0, t: 10, b: 0 },
      paper_bgcolor: '#0f172a',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      scene: {
        bgcolor: '#0f172a',
        xaxis: {
          title: 'X',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        yaxis: {
          title: 'Y',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        zaxis: {
          title: 'Z',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        camera: {
          eye: { x: 1.5, y: -1.6, z: 1.2 }
        },
        aspectmode: 'cube'
      },
      autosize: true
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false
    };

    Plotly.react(containerRef.current, traces, layout, config);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [meshData, colorscale, opacity, showWireframe]);

  const handleResetCamera = () => {
    if (containerRef.current) {
      Plotly.relayout(containerRef.current, {
        'scene.camera.eye': { x: 1.5, y: -1.6, z: 1.2 }
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-full">
      {/* Barra superior de controles */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Box className="w-4 h-4 text-cyan-400" />
          <span>{title}</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded">
            WebGL 3D
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Paleta */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={colorscale}
              onChange={(e) => setColorscale(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300"
            >
              <option value="Viridis">Viridis</option>
              <option value="Plasma">Plasma</option>
              <option value="Electric">Electric</option>
              <option value="Turbo">Turbo</option>
              <option value="Rainbow">Rainbow</option>
            </select>
          </div>

          {/* Toggle Wireframe */}
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`p-1.5 rounded text-xs border transition-colors ${
              showWireframe
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Alternar Malla / Wireframe"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Restablecer Vista de Cámara"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contenedor del Gráfico 3D */}
      <div ref={containerRef} className="w-full flex-1 min-h-[340px]" />

      {/* Barra de control inferior: Deslizador de Ángulo de Revolución */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Sliders className="w-3 h-3 text-cyan-400" /> Ángulo de Rotación (Barrido 360°)
            </span>
            <span className="font-mono text-cyan-300 font-semibold">{currentAngle}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="360"
            step="15"
            value={currentAngle}
            onChange={(e) => onAngleChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Opacidad de la Superficie</span>
            <span className="font-mono text-slate-300">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
