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
 * Genera la malla paramétrica 3D completa y cerrada para el sólido de revolución
 * Incluye superficie exterior, tapas en los extremos (x=a, x=b), caras de corte
 * interior y elemento diferencial representativo.
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
  gridTheta = 40,
  gridR = 15
}) {
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  if (fComp.error) throw new Error(fComp.error);

  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';
  const thetaMaxRad = (Math.max(5, Math.min(360, maxAngleDeg)) * Math.PI) / 180;
  const isHorizontal = axisType === 'horizontal';

  // Arreglos de u (de a hacia b) y theta (de 0 hacia thetaMax)
  const uVals = [];
  for (let i = 0; i <= gridU; i++) {
    uVals.push(a + (i / gridU) * (b - a));
  }

  const thetaVals = [];
  for (let j = 0; j <= gridTheta; j++) {
    thetaVals.push((j / gridTheta) * thetaMaxRad);
  }

  const isCut = maxAngleDeg < 355;

  let outerSurface = null;
  let innerSurface = null;
  let capA = null;
  let capB = null;
  let cutStart = null;
  let cutEnd = null;
  let representativeElement = null;

  if (isHorizontal) {
    // =========================================================================
    // CASO 1: GIRO ALREDEDOR DE EJE HORIZONTAL y = c (DISCOS Y ARANDELAS)
    // =========================================================================

    // Funciones de radio exterior e interior evaluadas
    const R_out = uVals.map(u => {
      const val = evaluateAt(fComp.compiled, u) ?? 0;
      return Math.abs(val - axisVal);
    });

    const r_in = uVals.map(u => {
      if (!hasG || !gComp.compiled) return 0;
      const val = evaluateAt(gComp.compiled, u) ?? 0;
      return Math.max(0, Math.min(Math.abs(val - axisVal), evaluateAt(fComp.compiled, u) ?? 0));
    });

    // 1. Superficie Exterior (Manto exterior)
    const X_out = [];
    const Y_out = [];
    const Z_out = [];
    for (let i = 0; i <= gridU; i++) {
      const u = uVals[i];
      const R = R_out[i];
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(u);
        rowY.push(axisVal + R * Math.cos(th));
        rowZ.push(R * Math.sin(th));
      }
      X_out.push(rowX);
      Y_out.push(rowY);
      Z_out.push(rowZ);
    }
    outerSurface = { X: X_out, Y: Y_out, Z: Z_out };

    // 2. Superficie Interior (si es arandela con hueco)
    const hasInnerHole = hasG && r_in.some(r => r > 0.001);
    if (hasInnerHole) {
      const X_in = [];
      const Y_in = [];
      const Z_in = [];
      for (let i = 0; i <= gridU; i++) {
        const u = uVals[i];
        const r = r_in[i];
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(u);
          rowY.push(axisVal + r * Math.cos(th));
          rowZ.push(r * Math.sin(th));
        }
        X_in.push(rowX);
        Y_in.push(rowY);
        Z_in.push(rowZ);
      }
      innerSurface = { X: X_in, Y: Y_in, Z: Z_in };
    }

    // 3. Tapa circular frontal en x = b
    const R_b = R_out[gridU];
    const r_b = r_in[gridU];
    if (R_b - r_b > 0.001) {
      const X_b = [];
      const Y_b = [];
      const Z_b = [];
      for (let k = 0; k <= gridR; k++) {
        const r = r_b + (k / gridR) * (R_b - r_b);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(b);
          rowY.push(axisVal + r * Math.cos(th));
          rowZ.push(r * Math.sin(th));
        }
        X_b.push(rowX);
        Y_b.push(rowY);
        Z_b.push(rowZ);
      }
      capB = { X: X_b, Y: Y_b, Z: Z_b };
    }

    // 4. Tapa circular trasera en x = a
    const R_a = R_out[0];
    const r_a = r_in[0];
    if (R_a - r_a > 0.001) {
      const X_a = [];
      const Y_a = [];
      const Z_a = [];
      for (let k = 0; k <= gridR; k++) {
        const r = r_a + (k / gridR) * (R_a - r_a);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(a);
          rowY.push(axisVal + r * Math.cos(th));
          rowZ.push(r * Math.sin(th));
        }
        X_a.push(rowX);
        Y_a.push(rowY);
        Z_a.push(rowZ);
      }
      capA = { X: X_a, Y: Y_a, Z: Z_a };
    }

    // 5. Caras planas de corte (cuando el ángulo es < 360°)
    if (isCut) {
      // Corte a theta = 0
      const X_c0 = [];
      const Y_c0 = [];
      const Z_c0 = [];
      // Corte a theta = thetaMax
      const X_c1 = [];
      const Y_c1 = [];
      const Z_c1 = [];

      for (let i = 0; i <= gridU; i++) {
        const u = uVals[i];
        const Rout = R_out[i];
        const rin = r_in[i];

        const rowX0 = [];
        const rowY0 = [];
        const rowZ0 = [];

        const rowX1 = [];
        const rowY1 = [];
        const rowZ1 = [];

        for (let k = 0; k <= gridR; k++) {
          const r = rin + (k / gridR) * (Rout - rin);

          // theta = 0
          rowX0.push(u);
          rowY0.push(axisVal + r);
          rowZ0.push(0);

          // theta = thetaMax
          rowX1.push(u);
          rowY1.push(axisVal + r * Math.cos(thetaMaxRad));
          rowZ1.push(r * Math.sin(thetaMaxRad));
        }

        X_c0.push(rowX0);
        Y_c0.push(rowY0);
        Z_c0.push(rowZ0);

        X_c1.push(rowX1);
        Y_c1.push(rowY1);
        Z_c1.push(rowZ1);
      }

      cutStart = { X: X_c0, Y: Y_c0, Z: Z_c0 };
      cutEnd = { X: X_c1, Y: Y_c1, Z: Z_c1 };
    }

    // 6. Elemento diferencial representativo (Disco dV interior resaltado)
    const midIdx = Math.floor(gridU * 0.55);
    const xMid = uVals[midIdx];
    const dx = Math.abs(b - a) * 0.05;
    const R_mid = R_out[midIdx];
    const r_mid = r_in[midIdx];

    const X_disc = [];
    const Y_disc = [];
    const Z_disc = [];
    for (let i = 0; i <= 3; i++) {
      const u = xMid + (i / 3) * dx;
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(u);
        rowY.push(axisVal + R_mid * Math.cos(th));
        rowZ.push(R_mid * Math.sin(th));
      }
      X_disc.push(rowX);
      Y_disc.push(rowY);
      Z_disc.push(rowZ);
    }
    representativeElement = {
      type: 'disk',
      X: X_disc,
      Y: Y_disc,
      Z: Z_disc,
      label: `Disco diferencial dV (x = ${xMid.toFixed(2)})`
    };

  } else {
    // =========================================================================
    // CASO 2: GIRO ALREDEDOR DE EJE VERTICAL x = k (CAPAS CILÍNDRICAS)
    // =========================================================================

    const p_vals = uVals.map(u => Math.abs(u - axisVal));
    const yTop_vals = uVals.map(u => evaluateAt(fComp.compiled, u) ?? 0);
    const yBot_vals = uVals.map(u => (hasG && gComp.compiled ? evaluateAt(gComp.compiled, u) ?? 0 : 0));

    // 1. Superficie Superior (Techo generado por f(x))
    const X_top = [];
    const Y_top = [];
    const Z_top = [];
    for (let i = 0; i <= gridU; i++) {
      const p = p_vals[i];
      const y = yTop_vals[i];
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(axisVal + p * Math.cos(th));
        rowY.push(y);
        rowZ.push(p * Math.sin(th));
      }
      X_top.push(rowX);
      Y_top.push(rowY);
      Z_top.push(rowZ);
    }
    outerSurface = { X: X_top, Y: Y_top, Z: Z_top };

    // 2. Superficie Inferior (Base en y = g(x) o y = 0)
    const X_bot = [];
    const Y_bot = [];
    const Z_bot = [];
    for (let i = 0; i <= gridU; i++) {
      const p = p_vals[i];
      const y = yBot_vals[i];
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(axisVal + p * Math.cos(th));
        rowY.push(y);
        rowZ.push(p * Math.sin(th));
      }
      X_bot.push(rowX);
      Y_bot.push(rowY);
      Z_bot.push(rowZ);
    }
    capA = { X: X_bot, Y: Y_bot, Z: Z_bot }; // Base del sólido

    // 3. Pared cilíndrica exterior en u = b
    const p_b = p_vals[gridU];
    const yT_b = yTop_vals[gridU];
    const yB_b = yBot_vals[gridU];
    if (Math.abs(yT_b - yB_b) > 0.001) {
      const X_wall = [];
      const Y_wall = [];
      const Z_wall = [];
      for (let k = 0; k <= gridR; k++) {
        const y = yB_b + (k / gridR) * (yT_b - yB_b);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(axisVal + p_b * Math.cos(th));
          rowY.push(y);
          rowZ.push(p_b * Math.sin(th));
        }
        X_wall.push(rowX);
        Y_wall.push(rowY);
        Z_wall.push(rowZ);
      }
      capB = { X: X_wall, Y: Y_wall, Z: Z_wall }; // Pared exterior cilíndrica
    }

    // 4. Pared cilíndrica interior en u = a (si no está pegada al eje)
    const p_a = p_vals[0];
    const yT_a = yTop_vals[0];
    const yB_a = yBot_vals[0];
    if (p_a > 0.001 && Math.abs(yT_a - yB_a) > 0.001) {
      const X_inwall = [];
      const Y_inwall = [];
      const Z_inwall = [];
      for (let k = 0; k <= gridR; k++) {
        const y = yB_a + (k / gridR) * (yT_a - yB_a);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(axisVal + p_a * Math.cos(th));
          rowY.push(y);
          rowZ.push(p_a * Math.sin(th));
        }
        X_inwall.push(rowX);
        Y_inwall.push(rowY);
        Z_inwall.push(rowZ);
      }
      innerSurface = { X: X_inwall, Y: Y_inwall, Z: Z_inwall };
    }

    // 5. Caras de corte para ángulo < 360°
    if (isCut) {
      const X_c0 = [];
      const Y_c0 = [];
      const Z_c0 = [];

      const X_c1 = [];
      const Y_c1 = [];
      const Z_c1 = [];

      for (let i = 0; i <= gridU; i++) {
        const p = p_vals[i];
        const yT = yTop_vals[i];
        const yB = yBot_vals[i];

        const rowX0 = [];
        const rowY0 = [];
        const rowZ0 = [];

        const rowX1 = [];
        const rowY1 = [];
        const rowZ1 = [];

        for (let k = 0; k <= gridR; k++) {
          const y = yB + (k / gridR) * (yT - yB);

          // theta = 0
          rowX0.push(axisVal + p);
          rowY0.push(y);
          rowZ0.push(0);

          // theta = thetaMax
          rowX1.push(axisVal + p * Math.cos(thetaMaxRad));
          rowY1.push(y);
          rowZ1.push(p * Math.sin(thetaMaxRad));
        }

        X_c0.push(rowX0);
        Y_c0.push(rowY0);
        Z_c0.push(rowZ0);

        X_c1.push(rowX1);
        Y_c1.push(rowY1);
        Z_c1.push(rowZ1);
      }

      cutStart = { X: X_c0, Y: Y_c0, Z: Z_c0 };
      cutEnd = { X: X_c1, Y: Y_c1, Z: Z_c1 };
    }
  }

  // Línea del eje de revolución para renderizar en 3D
  const span = Math.abs(b - a) || 2;
  const axisLine3D = isHorizontal
    ? {
        x: [a - 0.2 * span, b + 0.2 * span],
        y: [axisVal, axisVal],
        z: [0, 0],
        label: axisVal === 0 ? 'Eje X (y = 0)' : `Eje y = ${axisVal}`
      }
    : {
        x: [axisVal, axisVal],
        y: [-1, (evaluateAt(fComp.compiled, b) ?? 2) + 1],
        z: [0, 0],
        label: axisVal === 0 ? 'Eje Y (x = 0)' : `Eje x = ${axisVal}`
      };

  return {
    outer: outerSurface,
    inner: innerSurface,
    capA,
    capB,
    cutStart,
    cutEnd,
    representativeElement,
    axisLine3D,
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
