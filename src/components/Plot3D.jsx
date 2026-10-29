import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Box, RotateCcw, Sliders, Palette, Grid, Shield, Disc } from 'lucide-react';

export default function Plot3D({
  meshData,
  title = 'Sólido de Revolución en 3D',
  onAngleChange,
  currentAngle = 360
}) {
  const containerRef = useRef(null);
  const [colorscale, setColorscale] = useState('Viridis');
  const [opacity, setOpacity] = useState(0.92);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showCaps, setShowCaps] = useState(true);
  const [showDifferential, setShowDifferential] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !meshData || !meshData.outer) return;

    const traces = [];

    // 1. Superficie Exterior Principal
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
        x: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
        y: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
        z: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 }
      },
      lighting: {
        ambient: 0.75,
        diffuse: 0.85,
        specular: 0.35,
        roughness: 0.45
      }
    });

    // 2. Superficie Interior (si es arandela con hueco)
    if (meshData.inner && meshData.inner.X) {
      traces.push({
        type: 'surface',
        x: meshData.inner.X,
        y: meshData.inner.Y,
        z: meshData.inner.Z,
        colorscale: 'Plasma',
        opacity: Math.max(0.5, opacity * 0.85),
        showscale: false,
        name: 'Núcleo Interior (Hueco)',
        contours: {
          x: { show: showWireframe, color: '#f43f5e', width: 1 },
          y: { show: showWireframe, color: '#f43f5e', width: 1 },
          z: { show: showWireframe, color: '#f43f5e', width: 1 }
        }
      });
    }

    // 3. Tapas en los extremos para cerrar el sólido (capB y capA)
    if (showCaps) {
      // Tapa frontal en x = b (o pared cilíndrica)
      if (meshData.capB && meshData.capB.X) {
        traces.push({
          type: 'surface',
          x: meshData.capB.X,
          y: meshData.capB.Y,
          z: meshData.capB.Z,
          colorscale: colorscale,
          opacity: opacity,
          showscale: false,
          name: 'Tapa Extremo (x = b)',
          contours: {
            x: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
            y: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
            z: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 }
          },
          lighting: { ambient: 0.8, diffuse: 0.8 }
        });
      }

      // Tapa trasera en x = a (o base inferior)
      if (meshData.capA && meshData.capA.X) {
        traces.push({
          type: 'surface',
          x: meshData.capA.X,
          y: meshData.capA.Y,
          z: meshData.capA.Z,
          colorscale: colorscale,
          opacity: opacity,
          showscale: false,
          name: 'Tapa Base (x = a)',
          contours: {
            x: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
            y: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 },
            z: { show: showWireframe, color: 'rgba(56, 189, 248, 0.4)', width: 1 }
          },
          lighting: { ambient: 0.8, diffuse: 0.8 }
        });
      }

      // Caras planas de corte interno cuando el ángulo es < 360°
      if (meshData.cutStart && meshData.cutStart.X) {
        traces.push({
          type: 'surface',
          x: meshData.cutStart.X,
          y: meshData.cutStart.Y,
          z: meshData.cutStart.Z,
          colorscale: 'YlOrRd',
          opacity: Math.min(1.0, opacity + 0.1),
          showscale: false,
          name: 'Cara Interna de Corte (θ = 0°)',
          contours: {
            x: { show: showWireframe, color: '#f59e0b', width: 1 },
            y: { show: showWireframe, color: '#f59e0b', width: 1 }
          }
        });
      }

      if (meshData.cutEnd && meshData.cutEnd.X) {
        traces.push({
          type: 'surface',
          x: meshData.cutEnd.X,
          y: meshData.cutEnd.Y,
          z: meshData.cutEnd.Z,
          colorscale: 'YlOrRd',
          opacity: Math.min(1.0, opacity + 0.1),
          showscale: false,
          name: `Cara Interna de Corte (θ = ${currentAngle}°)`,
          contours: {
            x: { show: showWireframe, color: '#f59e0b', width: 1 },
            y: { show: showWireframe, color: '#f59e0b', width: 1 }
          }
        });
      }
    }

    // 4. Elemento diferencial representativo (Disco dV interior resaltado)
    if (showDifferential && meshData.representativeElement && meshData.representativeElement.X) {
      traces.push({
        type: 'surface',
        x: meshData.representativeElement.X,
        y: meshData.representativeElement.Y,
        z: meshData.representativeElement.Z,
        colorscale: 'Hot',
        opacity: 0.95,
        showscale: false,
        name: meshData.representativeElement.label || 'Disco dV',
        contours: {
          x: { show: true, color: '#ffffff', width: 2 },
          y: { show: true, color: '#ffffff', width: 2 },
          z: { show: true, color: '#ffffff', width: 2 }
        }
      });
    }

    // 5. Línea 3D del eje de revolución
    if (meshData.axisLine3D) {
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: meshData.axisLine3D.x,
        y: meshData.axisLine3D.y,
        z: meshData.axisLine3D.z,
        line: {
          color: '#ec4899',
          width: 5,
          dash: 'dash'
        },
        name: `Eje: ${meshData.axisLine3D.label}`
      });
    }

    const layout = {
      margin: { l: 0, r: 0, t: 10, b: 0 },
      paper_bgcolor: '#0f172a',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      scene: {
        bgcolor: '#0f172a',
        xaxis: {
          title: 'Eje X',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        yaxis: {
          title: 'Eje Y',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        zaxis: {
          title: 'Eje Z',
          backgroundcolor: '#090d16',
          gridcolor: '#1e293b',
          showbackground: true,
          zerolinecolor: '#38bdf8'
        },
        camera: {
          eye: { x: 1.6, y: -1.7, z: 1.3 }
        },
        aspectmode: 'cube'
      },
      showlegend: true,
      legend: {
        orientation: 'h',
        y: 1.05,
        x: 0,
        font: { size: 10, color: '#cbd5e1' }
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
  }, [meshData, colorscale, opacity, showWireframe, showCaps, showDifferential, currentAngle]);

  const handleResetCamera = () => {
    if (containerRef.current) {
      Plotly.relayout(containerRef.current, {
        'scene.camera.eye': { x: 1.6, y: -1.7, z: 1.3 }
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
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
            Sólido Cerrado
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Selector de Paleta */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-1">
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

          {/* Toggle Tapas / Sólido Cerrado */}
          <button
            onClick={() => setShowCaps(!showCaps)}
            className={`px-2 py-1 rounded text-[11px] border flex items-center gap-1 transition-colors ${
              showCaps
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Alternar Tapas de Extremo y Caras de Corte"
          >
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Tapas</span>
          </button>

          {/* Toggle Elemento Diferencial dV */}
          <button
            onClick={() => setShowDifferential(!showDifferential)}
            className={`px-2 py-1 rounded text-[11px] border flex items-center gap-1 transition-colors ${
              showDifferential
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Resaltar Elemento Diferencial dV (Disco/Capa interior)"
          >
            <Disc className="w-3 h-3" />
            <span className="hidden sm:inline">Disco dV</span>
          </button>

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
      <div ref={containerRef} className="w-full flex-1 min-h-[350px]" />

      {/* Barra de control inferior: Deslizador de Ángulo de Revolución y Opacidad */}
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
