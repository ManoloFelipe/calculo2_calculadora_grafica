import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Eye, Layers } from 'lucide-react';

export default function Plot2D({ plotData, title = 'Representación 2D de la Región' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !plotData) return;

    const traces = [];

    // 1. Región sombreada (polígono)
    if (plotData.region && plotData.region.polyX && plotData.region.polyX.length > 0) {
      traces.push({
        x: plotData.region.polyX,
        y: plotData.region.polyY,
        fill: 'toself',
        fillcolor: 'rgba(6, 182, 212, 0.25)', // cyan translúcido
        line: { color: 'rgba(6, 182, 212, 0.4)', width: 1 },
        name: 'Región R',
        type: 'scatter',
        hoverinfo: 'none'
      });
    }

    // 2. Curva f(x)
    if (plotData.fCurve) {
      traces.push({
        x: plotData.fCurve.x,
        y: plotData.fCurve.y,
        mode: 'lines',
        name: plotData.fCurve.name || 'f(x)',
        line: { color: '#06b6d4', width: 2.5 },
        type: 'scatter'
      });
    }

    // 3. Curva g(x) si existe
    if (plotData.gCurve) {
      traces.push({
        x: plotData.gCurve.x,
        y: plotData.gCurve.y,
        mode: 'lines',
        name: plotData.gCurve.name || 'g(x)',
        line: { color: '#f59e0b', width: 2, dash: 'dash' },
        type: 'scatter'
      });
    }

    // 4. Eje de Giro (si existe)
    const shapes = [];
    const annotations = [];

    if (plotData.axisLine) {
      if (plotData.axisLine.type === 'horizontal') {
        shapes.push({
          type: 'line',
          x0: plotData.axisLine.xRange[0],
          x1: plotData.axisLine.xRange[1],
          y0: plotData.axisLine.y,
          y1: plotData.axisLine.y,
          line: {
            color: '#ec4899', // pink-500
            width: 2,
            dash: 'dot'
          }
        });
        annotations.push({
          x: plotData.bounds.b,
          y: plotData.axisLine.y,
          text: `🔄 ${plotData.axisLine.label}`,
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#ec4899',
          font: { color: '#f472b6', size: 11 }
        });
      } else {
        // vertical
        shapes.push({
          type: 'line',
          x0: plotData.axisLine.x,
          x1: plotData.axisLine.x,
          y0: plotData.axisLine.yRange[0],
          y1: plotData.axisLine.yRange[1],
          line: {
            color: '#ec4899',
            width: 2,
            dash: 'dot'
          }
        });
        annotations.push({
          x: plotData.axisLine.x,
          y: (plotData.axisLine.yRange[0] + plotData.axisLine.yRange[1]) / 2,
          text: `🔄 ${plotData.axisLine.label}`,
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#ec4899',
          font: { color: '#f472b6', size: 11 }
        });
      }
    }

    // Líneas de los límites a y b
    if (plotData.bounds) {
      [plotData.bounds.a, plotData.bounds.b].forEach((limitVal, idx) => {
        shapes.push({
          type: 'line',
          x0: limitVal,
          x1: limitVal,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: {
            color: '#64748b',
            width: 1,
            dash: 'dash'
          }
        });
        annotations.push({
          x: limitVal,
          y: 0,
          yref: 'paper',
          text: idx === 0 ? `a = ${limitVal}` : `b = ${limitVal}`,
          showarrow: false,
          yshift: -15,
          font: { color: '#94a3b8', size: 10 }
        });
      });
    }

    const layout = {
      margin: { l: 45, r: 25, t: 30, b: 45 },
      paper_bgcolor: '#0f172a',
      plot_bgcolor: '#0f172a',
      font: { color: '#94a3b8', family: 'Inter, sans-serif' },
      xaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { size: 11, color: '#94a3b8' }
      },
      yaxis: {
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
        tickfont: { size: 11, color: '#94a3b8' }
      },
      showlegend: true,
      legend: {
        orientation: 'h',
        y: 1.12,
        x: 0,
        font: { size: 10, color: '#cbd5e1' }
      },
      shapes,
      annotations,
      autosize: true
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.react(containerRef.current, traces, layout, config);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [plotData]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{title}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Región plana generadora</span>
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-[340px]" />
    </div>
  );
}
