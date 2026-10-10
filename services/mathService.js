import * as math from 'mathjs';

/**
 * Normaliza expresiones matemáticas comunes escritas por estudiantes:
 * e.g., 'e^x' -> 'exp(x)', 'ln(x)' -> 'log(x)', 'sen(x)' -> 'sin(x)'
 */
export function normalizeExpression(exprStr) {
  if (!exprStr || typeof exprStr !== 'string') return '0';
  let clean = exprStr.trim();
  // sen(x) -> sin(x)
  clean = clean.replace(/sen\s*\(/gi, 'sin(');
  // ln(x) -> log(x)
  clean = clean.replace(/ln\s*\(/gi, 'log(');
  // e^x o e^(...) -> exp(x)
  clean = clean.replace(/\be\s*\^\s*([a-zA-Z0-9]+)/g, 'exp($1)');
  clean = clean.replace(/\be\s*\^\s*\(([^)]+)\)/g, 'exp($1)');
  return clean;
}

/**
 * Compila una expresión de forma segura
 */
export function compileExpression(exprStr) {
  const normalized = normalizeExpression(exprStr);
  try {
    return {
      compiled: math.compile(normalized),
      normalized,
      error: null
    };
  } catch (err) {
    return {
      compiled: null,
      normalized,
      error: `Error al compilar '${exprStr}': ${err.message}`
    };
  }
}

/**
 * Evalúa una función compilada en un valor x dado
 */
export function evaluateAt(compiled, xVal) {
  try {
    const res = compiled.evaluate({ x: xVal, pi: Math.PI, e: Math.E });
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Integración Numérica por Regla de Simpson Compuesta 1/3
 */
export function numericalIntegrate(fn, a, b, n = 200) {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let sum = (fn(a) || 0) + (fn(b) || 0);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const val = fn(x) || 0;
    if (i % 2 === 0) {
      sum += 2 * val;
    } else {
      sum += 4 * val;
    }
  }

  return (h / 3) * sum;
}

/**
 * Genera puntos para la gráfica 2D (curva, área bajo la curva, ejes)
 */
export function generate2DPlotData({
  fStr,
  gStr = '0',
  a,
  b,
  axisType = 'horizontal', // 'horizontal' | 'vertical'
  axisVal = 0,
  mode = 'solid' // 'solid' | 'area'
}) {
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');

  if (fComp.error) throw new Error(fComp.error);

  const numPointsInterval = 100;
  const span = Math.abs(b - a) || 1;
  const pad = span * 0.3;
  const xMin = Math.min(a, b) - pad;
  const xMax = Math.max(a, b) + pad;
  const totalPoints = 200;

  // Curva extendida f(x)
  const curveX = [];
  const curveY = [];
  const stepExt = (xMax - xMin) / totalPoints;
  for (let i = 0; i <= totalPoints; i++) {
    const x = xMin + i * stepExt;
    const y = evaluateAt(fComp.compiled, x);
    if (y !== null) {
      curveX.push(x);
      curveY.push(y);
    }
  }

  // Curva extendida g(x) si existe
  const curveG_X = [];
  const curveG_Y = [];
  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';
  if (hasG && gComp.compiled) {
    for (let i = 0; i <= totalPoints; i++) {
      const x = xMin + i * stepExt;
      const y = evaluateAt(gComp.compiled, x);
      if (y !== null) {
        curveG_X.push(x);
        curveG_Y.push(y);
      }
    }
  }

  // Región de integración sombreada [a, b]
  const regionX = [];
  const regionY_f = [];
  const regionY_g = [];
  const stepInt = (b - a) / numPointsInterval;
  for (let i = 0; i <= numPointsInterval; i++) {
    const x = a + i * stepInt;
    const yF = evaluateAt(fComp.compiled, x) ?? 0;
    const yG = hasG && gComp.compiled ? (evaluateAt(gComp.compiled, x) ?? 0) : 0;
    regionX.push(x);
    regionY_f.push(yF);
    regionY_g.push(yG);
  }

  // Polígono cerrado para sombrear región entre f y g
  // [a..b hacia adelante con f(x), b..a hacia atrás con g(x)]
  const fillPolyX = [...regionX, ...[...regionX].reverse()];
  const fillPolyY = [...regionY_f, ...[...regionY_g].reverse()];

  // Eje de revolución para mostrar en 2D
  let axisLine = null;
  if (mode === 'solid') {
    if (axisType === 'horizontal') {
      axisLine = {
        type: 'horizontal',
        y: axisVal,
        xRange: [xMin, xMax],
        label: axisVal === 0 ? 'Eje X (y = 0)' : `Eje y = ${axisVal}`
      };
    } else {
      // vertical x = k
      const allY = [...curveY, ...regionY_f, axisVal];
      const yMin = Math.min(...allY) - 1;
      const yMax = Math.max(...allY) + 1;
      axisLine = {
        type: 'vertical',
        x: axisVal,
        yRange: [yMin, yMax],
        label: axisVal === 0 ? 'Eje Y (x = 0)' : `Eje x = ${axisVal}`
      };
    }
  }

  return {
    fCurve: { x: curveX, y: curveY, name: `f(x) = ${fStr}` },
    gCurve: hasG ? { x: curveG_X, y: curveG_Y, name: `g(x) = ${gStr}` } : null,
    region: {
      x: regionX,
      yF: regionY_f,
      yG: regionY_g,
      polyX: fillPolyX,
      polyY: fillPolyY
    },
    bounds: { a, b },
    axisLine
  };
}

/**
 * Genera la malla paramétrica 3D para el sólido de revolución
 * @param {Object} params
 * @returns {Object} Malla(s) de superficie para Plotly (matrices X, Y, Z)
 */
export function generate3DRevolutionMesh({
  fStr,
  gStr = '0',
  a,
  b,
  axisType = 'horizontal', // 'horizontal' (y=c) | 'vertical' (x=k)
  axisVal = 0,
  maxAngleDeg = 360,
  gridU = 35,
  gridTheta = 40
}) {
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  if (fComp.error) throw new Error(fComp.error);

  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';
  const thetaMaxRad = (Math.max(5, Math.min(360, maxAngleDeg)) * Math.PI) / 180;

  // Arreglos de u (de a hacia b) y theta (de 0 hacia thetaMax)
  const uVals = [];
  for (let i = 0; i <= gridU; i++) {
    uVals.push(a + (i / gridU) * (b - a));
  }

  const thetaVals = [];
  for (let j = 0; j <= gridTheta; j++) {
    thetaVals.push((j / gridTheta) * thetaMaxRad);
  }

  /**
   * Construye una superficie paramétrica dada una función r(u)
   */
  function buildSurface(compiledFn, isHorizontal) {
    const X = [];
    const Y = [];
    const Z = [];

    for (let i = 0; i <= gridU; i++) {
      const u = uVals[i];
      const val = evaluateAt(compiledFn, u) ?? 0;

      const rowX = [];
      const rowY = [];
      const rowZ = [];

      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];

        if (isHorizontal) {
          // Giro alrededor de la recta horizontal y = axisVal
          // Radio en x=u: R = val - axisVal
          const R = val - axisVal;
          // X: coordenada a lo largo del eje X (u)
          // Y: axisVal + R*cos(th)
          // Z: R*sin(th)
          rowX.push(u);
          rowY.push(axisVal + R * Math.cos(th));
          rowZ.push(R * Math.sin(th));
        } else {
          // Giro alrededor de la recta vertical x = axisVal (Cascarones / Capas)
          // El radio cilíndrico es p = u - axisVal
          // X: axisVal + p*cos(th)
          // Y: val (altura de la curva f(u))
          // Z: p*sin(th)
          const p = u - axisVal;
          rowX.push(axisVal + p * Math.cos(th));
          rowY.push(val);
          rowZ.push(p * Math.sin(th));
        }
      }

      X.push(rowX);
      Y.push(rowY);
      Z.push(rowZ);
    }

    return { X, Y, Z };
  }

  // Superficie exterior con f(x)
  const outerSurface = buildSurface(fComp.compiled, axisType === 'horizontal');

  // Superficie interior con g(x) si es método de arandelas
  let innerSurface = null;
  if (hasG && gComp.compiled) {
    innerSurface = buildSurface(gComp.compiled, axisType === 'horizontal');
  }

  // Tapas frontales / cortes si el ángulo no es 360 o para delimitar el sólido
  // Superficie base/eje para referencia
  return {
    outer: outerSurface,
    inner: innerSurface,
    thetaMaxDeg: maxAngleDeg,
    axisType,
    axisVal
  };
}

/**
 * Cálculo numérico de volumen y área de referencia para verificación
 */
export function calculateNumericalReference({
  fStr,
  gStr = '0',
  a,
  b,
  axisType = 'horizontal',
  axisVal = 0,
  method = 'auto',
  mode = 'solid'
}) {
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  if (fComp.error) throw new Error(fComp.error);

  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';

  if (mode === 'area') {
    // Área = ∫ [f(x) - g(x)] dx
    const areaVal = numericalIntegrate(
      x => {
        const yF = evaluateAt(fComp.compiled, x) ?? 0;
        const yG = hasG && gComp.compiled ? (evaluateAt(gComp.compiled, x) ?? 0) : 0;
        return Math.abs(yF - yG);
      },
      a,
      b
    );

    return {
      type: 'area',
      value: areaVal,
      formatted: areaVal.toFixed(4),
      units: 'u²'
    };
  }

  // Sólido de Revolución
  let volumeVal = 0;
  let formulaType = method;

  if (axisType === 'horizontal') {
    // Giro alrededor de y = c
    // Discos o Arandelas
    if (!hasG) {
      // Discos: V = π ∫ [f(x) - c]^2 dx
      formulaType = 'discos';
      const intVal = numericalIntegrate(
        x => {
          const R = (evaluateAt(fComp.compiled, x) ?? 0) - axisVal;
          return R * R;
        },
        a,
        b
      );
      volumeVal = Math.PI * intVal;
    } else {
      // Arandelas: V = π ∫ ([R(x)]^2 - [r(x)]^2) dx
      formulaType = 'arandelas';
      const intVal = numericalIntegrate(
        x => {
          const R = Math.abs((evaluateAt(fComp.compiled, x) ?? 0) - axisVal);
          const r = Math.abs((evaluateAt(gComp.compiled, x) ?? 0) - axisVal);
          return Math.max(0, R * R - r * r);
        },
        a,
        b
      );
      volumeVal = Math.PI * intVal;
    }
  } else {
    // Giro alrededor de recta vertical x = k
    // Capas cilíndricas: V = 2π ∫ |x - k| * (f(x) - g(x)) dx
    formulaType = 'capas';
    const intVal = numericalIntegrate(
      x => {
        const radius = Math.abs(x - axisVal);
        const yF = evaluateAt(fComp.compiled, x) ?? 0;
        const yG = hasG && gComp.compiled ? (evaluateAt(gComp.compiled, x) ?? 0) : 0;
        const height = Math.max(0, yF - yG);
        return radius * height;
      },
      a,
      b
    );
    volumeVal = 2 * Math.PI * intVal;
  }

  const piFactor = volumeVal / Math.PI;

  return {
    type: 'solid',
    method: formulaType,
    volume: volumeVal,
    formatted: volumeVal.toFixed(4),
    piFactor: piFactor.toFixed(4),
    units: 'u³'
  };
}
