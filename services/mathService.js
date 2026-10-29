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
  gridU = 55,
  gridTheta = 64,
  gridR = 25
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
    // Coordenadas: X = u (longitudinal), Y = c + r*cos(θ), Z = r*sin(θ) (sección circular)
    // =========================================================================

    const R_out = [];
    const r_in = [];

    for (let i = 0; i <= gridU; i++) {
      const u = uVals[i];
      const valF = evaluateAt(fComp.compiled, u) ?? 0;
      const valG = (hasG && gComp.compiled) ? (evaluateAt(gComp.compiled, u) ?? 0) : 0;

      const dF = Math.abs(valF - axisVal);
      const dG = hasG ? Math.abs(valG - axisVal) : (axisVal === 0 ? 0 : Math.abs(0 - axisVal));

      R_out.push(Math.max(dF, dG));
      r_in.push(hasG || axisVal !== 0 ? Math.min(dF, dG) : 0);
    }

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

    // 2. Superficie Interior (Hueco central si r_in > 0.005)
    const hasInnerHole = r_in.some(r => r > 0.005);
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

    // 3. Tapa circular plana en x = b
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

    // 4. Tapa circular plana en x = a
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

    // 5. Caras de corte para rotación parcial (< 360°)
    if (isCut) {
      const X_c0 = [];
      const Y_c0 = [];
      const Z_c0 = [];

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

          // θ = 0 (Plano X-Y)
          rowX0.push(u);
          rowY0.push(axisVal + r);
          rowZ0.push(0);

          // θ = θ_max
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

    // 6. Elemento diferencial dV (Disco / Arandela transversal)
    const midIdx = Math.floor(gridU * 0.55);
    const xMid = uVals[midIdx];
    const dx = Math.abs(b - a) * 0.04;
    const R_mid = R_out[midIdx];
    const r_mid = r_in[midIdx];

    const X_disc = [];
    const Y_disc = [];
    const Z_disc = [];
    for (let k = 0; k <= gridR; k++) {
      const r = r_mid + (k / gridR) * (R_mid - r_mid);
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(xMid);
        rowY.push(axisVal + r * Math.cos(th));
        rowZ.push(r * Math.sin(th));
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
      label: hasInnerHole
        ? `Arandela dV (x = ${xMid.toFixed(2)}, R = ${R_mid.toFixed(2)}, r = ${r_mid.toFixed(2)})`
        : `Disco dV (x = ${xMid.toFixed(2)}, R = ${R_mid.toFixed(2)})`
    };

  } else {
    // =========================================================================
    // CASO 2: GIRO ALREDEDOR DE EJE VERTICAL x = k (CAPAS CILÍNDRICAS / CASCARONES)
    // Coordenadas: Z = Altura vertical y, X = k + p*cos(θ), Y = p*sin(θ)
    // =========================================================================

    const p_vals = [];
    const yTop_vals = [];
    const yBot_vals = [];

    for (let i = 0; i <= gridU; i++) {
      const u = uVals[i];
      const valF = evaluateAt(fComp.compiled, u) ?? 0;
      const valG = (hasG && gComp.compiled) ? (evaluateAt(gComp.compiled, u) ?? 0) : 0;

      // Ordenar dinámicamente techo y base para evitar inversiones
      yTop_vals.push(Math.max(valF, valG));
      yBot_vals.push(Math.min(valF, valG));
      p_vals.push(Math.abs(u - axisVal));
    }

    // 1. Superficie Superior (Techo del sólido formado por max(f, g))
    const X_top = [];
    const Y_top = [];
    const Z_top = [];
    for (let i = 0; i <= gridU; i++) {
      const p = p_vals[i];
      const z = yTop_vals[i];
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(axisVal + p * Math.cos(th));
        rowY.push(p * Math.sin(th));
        rowZ.push(z);
      }
      X_top.push(rowX);
      Y_top.push(rowY);
      Z_top.push(rowZ);
    }
    outerSurface = { X: X_top, Y: Y_top, Z: Z_top };

    // 2. Superficie Inferior (Base del sólido formada por min(f, g))
    const X_bot = [];
    const Y_bot = [];
    const Z_bot = [];
    for (let i = 0; i <= gridU; i++) {
      const p = p_vals[i];
      const z = yBot_vals[i];
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(axisVal + p * Math.cos(th));
        rowY.push(p * Math.sin(th));
        rowZ.push(z);
      }
      X_bot.push(rowX);
      Y_bot.push(rowY);
      Z_bot.push(rowZ);
    }
    capA = { X: X_bot, Y: Y_bot, Z: Z_bot }; // Base del sólido

    // 3. Pared Cilíndrica Exterior (en el extremo con mayor radio)
    const pA = p_vals[0];
    const pB = p_vals[gridU];
    const isBOuter = pB >= pA;

    const p_outer = isBOuter ? pB : pA;
    const yT_out = isBOuter ? yTop_vals[gridU] : yTop_vals[0];
    const yB_out = isBOuter ? yBot_vals[gridU] : yBot_vals[0];

    if (Math.abs(yT_out - yB_out) > 0.001) {
      const X_wall = [];
      const Y_wall = [];
      const Z_wall = [];
      for (let k = 0; k <= gridR; k++) {
        const z = yB_out + (k / gridR) * (yT_out - yB_out);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(axisVal + p_outer * Math.cos(th));
          rowY.push(p_outer * Math.sin(th));
          rowZ.push(z);
        }
        X_wall.push(rowX);
        Y_wall.push(rowY);
        Z_wall.push(rowZ);
      }
      capB = { X: X_wall, Y: Y_wall, Z: Z_wall }; // Manto cilíndrico exterior
    }

    // 4. Pared Cilíndrica Interior (en el extremo con menor radio, si no toca el eje)
    const p_inner = isBOuter ? pA : pB;
    const yT_in = isBOuter ? yTop_vals[0] : yTop_vals[gridU];
    const yB_in = isBOuter ? yBot_vals[0] : yBot_vals[gridU];

    if (p_inner > 0.005 && Math.abs(yT_in - yB_in) > 0.001) {
      const X_inwall = [];
      const Y_inwall = [];
      const Z_inwall = [];
      for (let k = 0; k <= gridR; k++) {
        const z = yB_in + (k / gridR) * (yT_in - yB_in);
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j <= gridTheta; j++) {
          const th = thetaVals[j];
          rowX.push(axisVal + p_inner * Math.cos(th));
          rowY.push(p_inner * Math.sin(th));
          rowZ.push(z);
        }
        X_inwall.push(rowX);
        Y_inwall.push(rowY);
        Z_inwall.push(rowZ);
      }
      innerSurface = { X: X_inwall, Y: Y_inwall, Z: Z_inwall }; // Manto cilíndrico interior
    }

    // 5. Caras de corte para ángulo parcial (< 360°)
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
          const z = yB + (k / gridR) * (yT - yB);

          // θ = 0 (Plano X-Z)
          rowX0.push(axisVal + p);
          rowY0.push(0);
          rowZ0.push(z);

          // θ = θ_max
          rowX1.push(axisVal + p * Math.cos(thetaMaxRad));
          rowY1.push(p * Math.sin(thetaMaxRad));
          rowZ1.push(z);
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

    // 6. Elemento diferencial dV (Cascarón Cilíndrico diferencial)
    const midIdx = Math.floor(gridU * 0.55);
    const p_mid = p_vals[midIdx];
    const yB_mid = yBot_vals[midIdx];
    const yT_mid = yTop_vals[midIdx];
    const h_mid = Math.max(0.01, yT_mid - yB_mid);

    const X_shell = [];
    const Y_shell = [];
    const Z_shell = [];
    for (let k = 0; k <= gridR; k++) {
      const z = yB_mid + (k / gridR) * h_mid;
      const rowX = [];
      const rowY = [];
      const rowZ = [];
      for (let j = 0; j <= gridTheta; j++) {
        const th = thetaVals[j];
        rowX.push(axisVal + p_mid * Math.cos(th));
        rowY.push(p_mid * Math.sin(th));
        rowZ.push(z);
      }
      X_shell.push(rowX);
      Y_shell.push(rowY);
      Z_shell.push(rowZ);
    }
    representativeElement = {
      type: 'shell',
      X: X_shell,
      Y: Y_shell,
      Z: Z_shell,
      label: `Capa cilíndrica dV (p = ${p_mid.toFixed(2)}, h = ${h_mid.toFixed(2)})`
    };
  }

  // Línea 3D del eje de revolución para renderizar
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
        y: [0, 0],
        z: [
          Math.min(...(capA ? capA.Z.map(row => row[0]) : [-1])) - 0.5,
          Math.max(...(outerSurface ? outerSurface.Z.map(row => row[0]) : [3])) + 0.5
        ],
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
          const d1 = Math.abs((evaluateAt(fComp.compiled, x) ?? 0) - axisVal);
          const d2 = Math.abs((evaluateAt(gComp.compiled, x) ?? 0) - axisVal);
          const R = Math.max(d1, d2);
          const r = Math.min(d1, d2);
          return Math.max(0, R * R - r * r);
        },
        a,
        b
      );
      volumeVal = Math.PI * intVal;
    }
  } else {
    // Giro alrededor de recta vertical x = k
    // Capas cilíndricas: V = 2π ∫ |x - k| * |f(x) - g(x)| dx
    formulaType = 'capas';
    const intVal = numericalIntegrate(
      x => {
        const radius = Math.abs(x - axisVal);
        const yF = evaluateAt(fComp.compiled, x) ?? 0;
        const yG = hasG && gComp.compiled ? (evaluateAt(gComp.compiled, x) ?? 0) : 0;
        const height = Math.abs(yF - yG);
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
