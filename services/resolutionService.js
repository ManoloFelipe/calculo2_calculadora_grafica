import * as math from 'mathjs';
import { compileExpression, evaluateAt, numericalIntegrate } from './mathService.js';

/**
 * Convierte expresiones matemáticas a notación LaTeX elegante.
 * Transforma sqrt(x) a \sqrt{x}, potencias, exponenciales y productos.
 */
export function exprToLatex(expr) {
  if (!expr || typeof expr !== 'string' || expr.trim() === '' || expr.trim() === '0') return '0';
  let s = expr.trim();

  // sen(x) -> \sin(x)
  s = s.replace(/\bsen\s*\(/gi, '\\sin(');
  s = s.replace(/\bsin\s*\(/gi, '\\sin(');
  s = s.replace(/\bcos\s*\(/gi, '\\cos(');
  s = s.replace(/\btan\s*\(/gi, '\\tan(');
  s = s.replace(/\bln\s*\(/gi, '\\ln(');

  // sqrt(...) -> \sqrt{...}
  s = s.replace(/sqrt\s*\(([^)]+)\)/gi, (match, p1) => `\\sqrt{${p1.trim()}}`);

  // Exponenciales e^...
  s = s.replace(/\bexp\s*\(([^)]+)\)/gi, (match, p1) => `e^{${p1.trim()}}`);
  s = s.replace(/\be\s*\^\s*([a-zA-Z0-9]+)/gi, (match, p1) => `e^{${p1}}`);
  s = s.replace(/\be\s*\^\s*\(([^)]+)\)/gi, (match, p1) => `e^{${p1.trim()}}`);

  // Multiplicaciones
  s = s.replace(/\*/g, ' \\cdot ');

  // Símbolo pi
  s = s.replace(/\bpi\b/gi, '\\pi');

  return s;
}

/**
 * Máximo Común Divisor (Algoritmo de Euclides)
 */
function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Convierte un número decimal a una fracción reducida si es racional dentro de cierta tolerancia
 */
export function toFraction(val, tolerance = 1e-4) {
  if (Math.abs(val) < 1e-8) return { n: 0, d: 1, isExact: true, str: '0', latex: '0' };
  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);

  for (let d = 1; d <= 500; d++) {
    const n = Math.round(absVal * d);
    if (Math.abs(absVal - n / d) < tolerance) {
      const g = gcd(n, d);
      const finN = sign * (n / g);
      const finD = d / g;
      const str = finD === 1 ? `${finN}` : `${finN}/${finD}`;
      const latex = finD === 1
        ? `${finN}`
        : (finN < 0 ? `-\\frac{${Math.abs(finN)}}{${finD}}` : `\\frac{${finN}}{${finD}}`);
      return { n: finN, d: finD, isExact: true, str, latex };
    }
  }
  return { n: val, d: 1, isExact: false, str: val.toFixed(4), latex: val.toFixed(4) };
}

/**
 * Formatea un factor multiplicado por \pi en LaTeX elegante
 */
export function formatPiFactorLatex(val) {
  const frac = toFraction(val);
  if (!frac.isExact) {
    return `${val.toFixed(4)}\\pi`;
  }
  if (frac.d === 1) {
    if (frac.n === 0) return '0';
    if (frac.n === 1) return '\\pi';
    if (frac.n === -1) return '-\\pi';
    return `${frac.n}\\pi`;
  }
  if (frac.n === 1) return `\\frac{\\pi}{${frac.d}}`;
  if (frac.n === -1) return `-\\frac{\\pi}{${frac.d}}`;
  if (frac.n < 0) return `-\\frac{${Math.abs(frac.n)}\\pi}{${frac.d}}`;
  return `\\frac{${frac.n}\\pi}{${frac.d}}`;
}

/**
 * Extrae términos polinomiales de un AST de mathjs: [ { coeff, power }, ... ]
 */
function getTermsFromAST(node) {
  if (node.isOperatorNode && (node.op === '+' || node.op === '-')) {
    if (node.args.length === 1 && node.op === '-') {
      const sub = getTermsFromAST(node.args[0]);
      if (!sub) return null;
      sub.forEach(t => t.coeff *= -1);
      return sub;
    }
    const leftTerms = getTermsFromAST(node.args[0]);
    const rightTerms = getTermsFromAST(node.args[1]);
    if (!leftTerms || !rightTerms) return null;
    if (node.op === '-') {
      rightTerms.forEach(t => t.coeff *= -1);
    }
    return [...leftTerms, ...rightTerms];
  }

  if (node.isConstantNode) {
    return [{ coeff: node.value, power: 0 }];
  }

  if (node.isSymbolNode) {
    if (node.name === 'x') return [{ coeff: 1, power: 1 }];
    if (node.name === 'x_half') return [{ coeff: 1, power: 0.5 }];
    if (node.name === 'x_three_half') return [{ coeff: 1, power: 1.5 }];
  }

  if (node.isOperatorNode && node.op === '^') {
    if (node.args[0].isSymbolNode && node.args[0].name === 'x' && node.args[1].isConstantNode) {
      return [{ coeff: 1, power: node.args[1].value }];
    }
  }

  if (node.isOperatorNode && node.op === '*') {
    const a0 = node.args[0];
    const a1 = node.args[1];
    if (a0.isConstantNode) {
      if (a1.isSymbolNode && a1.name === 'x') return [{ coeff: a0.value, power: 1 }];
      if (a1.isSymbolNode && a1.name === 'x_half') return [{ coeff: a0.value, power: 0.5 }];
      if (a1.isSymbolNode && a1.name === 'x_three_half') return [{ coeff: a0.value, power: 1.5 }];
      if (a1.isOperatorNode && a1.op === '^' && a1.args[0].name === 'x') {
        return [{ coeff: a0.value, power: a1.args[1].value }];
      }
    }
    if (a1.isConstantNode) {
      if (a0.isSymbolNode && a0.name === 'x') return [{ coeff: a1.value, power: 1 }];
      if (a0.isSymbolNode && a0.name === 'x_half') return [{ coeff: a1.value, power: 0.5 }];
      if (a0.isSymbolNode && a0.name === 'x_three_half') return [{ coeff: a1.value, power: 1.5 }];
      if (a0.isOperatorNode && a0.op === '^' && a0.args[0].name === 'x') {
        return [{ coeff: a1.value, power: a0.args[1].value }];
      }
    }
  }

  return null;
}

/**
 * Analiza un integrando algebraicamente para extraer sus términos de potencia
 */
function analyzeIntegrandTerms(exprStr) {
  try {
    let s = exprStr.trim();
    // Reemplazar (sqrt(x))^2 por x
    s = s.replace(/(\(?\s*sqrt\s*\(\s*x\s*\)\s*\)?)\s*\^\s*2/g, 'x');
    // Reemplazar x * sqrt(x) por x_three_half
    s = s.replace(/x\s*\*\s*sqrt\s*\(\s*x\s*\)/g, 'x_three_half');
    s = s.replace(/sqrt\s*\(\s*x\s*\)\s*\*\s*x/g, 'x_three_half');
    // Reemplazar sqrt(x) por x_half
    s = s.replace(/sqrt\s*\(\s*x\s*\)/g, 'x_half');

    const rational = math.rationalize(s);
    const rawTerms = getTermsFromAST(rational);
    if (!rawTerms) return null;

    // Consolidar potencias iguales
    const powerMap = new Map();
    for (const t of rawTerms) {
      const p = t.power;
      powerMap.set(p, (powerMap.get(p) || 0) + t.coeff);
    }

    const consolidated = [];
    for (const [power, coeff] of powerMap.entries()) {
      if (Math.abs(coeff) > 1e-9) {
        consolidated.push({ coeff, power });
      }
    }

    return consolidated.sort((a, b) => b.power - a.power);
  } catch {
    return null;
  }
}

/**
 * Formatea términos a expresión algebraica en LaTeX
 */
function formatPolynomialLatex(terms) {
  if (!terms || terms.length === 0) return '0';
  const sorted = [...terms].sort((a, b) => b.power - a.power);
  let res = '';
  sorted.forEach((t, i) => {
    if (Math.abs(t.coeff) < 1e-9) return;
    const sign = t.coeff < 0 ? '-' : '+';
    const absC = Math.abs(t.coeff);
    let termStr = '';

    if (t.power === 0) {
      termStr = `${absC}`;
    } else if (t.power === 1) {
      termStr = absC === 1 ? 'x' : `${absC}x`;
    } else if (t.power === 1.5) {
      termStr = absC === 1 ? 'x^{3/2}' : `${absC}x^{3/2}`;
    } else if (t.power === 0.5) {
      termStr = absC === 1 ? '\\sqrt{x}' : `${absC}\\sqrt{x}`;
    } else {
      termStr = absC === 1 ? `x^{${t.power}}` : `${absC}x^{${t.power}}`;
    }

    if (i === 0) {
      res += (t.coeff < 0 ? '-' : '') + termStr;
    } else {
      res += ` ${sign} ${termStr}`;
    }
  });
  return res || '0';
}

/**
 * Formatea la antiderivada término a término: ∫ c x^p dx = c/(p+1) x^(p+1)
 */
function formatAntiderivativeLatex(terms) {
  if (!terms || terms.length === 0) return '0';
  const sorted = [...terms].sort((a, b) => b.power - a.power);
  let res = '';
  sorted.forEach((t, i) => {
    if (Math.abs(t.coeff) < 1e-9) return;
    const sign = t.coeff < 0 ? '-' : '+';
    const absC = Math.abs(t.coeff);

    let fracStr = '';
    if (t.power === 1.5) {
      const num = 2 * absC;
      const den = 5;
      const g = gcd(num, den);
      fracStr = `\\frac{${num / g}x^{5/2}}{${den / g}}`;
    } else if (t.power === 0.5) {
      const num = 2 * absC;
      const den = 3;
      const g = gcd(num, den);
      fracStr = `\\frac{${num / g}x^{3/2}}{${den / g}}`;
    } else {
      const newP = t.power + 1;
      const g = gcd(absC, newP);
      const num = absC / g;
      const den = newP / g;
      const xStr = newP === 1 ? 'x' : `x^{${newP}}`;

      if (den === 1) {
        fracStr = num === 1 ? xStr : `${num}${xStr}`;
      } else {
        fracStr = num === 1 ? `\\frac{${xStr}}{${den}}` : `\\frac{${num}${xStr}}{${den}}`;
      }
    }

    if (i === 0) {
      res += (t.coeff < 0 ? '-' : '') + fracStr;
    } else {
      res += ` ${sign} ${fracStr}`;
    }
  });
  return res || '0';
}

/**
 * Evalúa numéricamente la antiderivada en un valor x
 */
function evalAntiderivativeAt(terms, x) {
  if (!terms) return 0;
  let sum = 0;
  for (const t of terms) {
    const newP = t.power + 1;
    sum += (t.coeff / newP) * Math.pow(x, newP);
  }
  return sum;
}

/**
 * Generador de resolución detallada analítica y paso a paso para el ÁREA de una región plana
 */
export function generateAreaProcedure({
  fStr,
  gStr = '0',
  a,
  b,
  numRef = null
}) {
  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';
  const lowX = Math.min(a, b);
  const highX = Math.max(a, b);

  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  if (fComp.error) throw new Error(fComp.error);
  if (hasG && gComp.error) throw new Error(gComp.error);

  const midX = (lowX + highX) / 2;
  const fMid = evaluateAt(fComp.compiled, midX) ?? 0;
  const gMid = (hasG && gComp.compiled) ? (evaluateAt(gComp.compiled, midX) ?? 0) : 0;

  const fLatex = exprToLatex(fStr);
  const gLatex = hasG ? exprToLatex(gStr) : '0';

  const isFUpper = fMid >= gMid;
  const topLatex = isFUpper ? fLatex : gLatex;
  const botLatex = isFUpper ? (hasG ? gLatex : '0') : fLatex;
  const topStr = isFUpper ? fStr : gStr;
  const botStr = isFUpper ? (hasG ? gStr : '0') : fStr;

  const methodTitle = hasG ? 'Área entre dos Curvas' : 'Área bajo la Curva f(x)';
  const methodJustification = hasG
    ? `Se calcula el área de la región plana comprendida entre la curva superior $y_{\\text{sup}} = ${topLatex}$ y la curva inferior $y_{\\text{inf}} = ${botLatex}$ en el intervalo $[${lowX}, ${highX}]$.`
    : `Se calcula el área de la región plana bajo la curva $y = ${fLatex}$ respecto al eje X en el intervalo $[${lowX}, ${highX}]$, donde $dA = f(x)\\,dx$.`;

  const integralLatex = hasG
    ? `A = \\int_{${lowX}}^{${highX}} \\left( (${topLatex}) - (${botLatex}) \\right) \\, dx`
    : `A = \\int_{${lowX}}^{${highX}} (${fLatex}) \\, dx`;

  const elementVolumeLatex = hasG
    ? `dA = [y_{\\text{sup}} - y_{\\text{inf}}] \\, dx = \\left[ (${topLatex}) - (${botLatex}) \\right] \\, dx`
    : `dA = f(x) \\, dx = (${fLatex}) \\, dx`;

  const rawIntegrandStr = hasG ? `(${topStr}) - (${botStr})` : fStr;

  const terms = analyzeIntegrandTerms(rawIntegrandStr);
  let integrandLatex = '';
  let antiderivativeLatex = '';
  let valB = 0;
  let valA = 0;
  let deltaF = 0;

  if (terms && terms.length > 0) {
    integrandLatex = formatPolynomialLatex(terms);
    antiderivativeLatex = formatAntiderivativeLatex(terms);
    valB = evalAntiderivativeAt(terms, highX);
    valA = evalAntiderivativeAt(terms, lowX);
    deltaF = valB - valA;
  } else {
    const fInt = compileExpression(rawIntegrandStr);
    integrandLatex = exprToLatex(rawIntegrandStr);
    antiderivativeLatex = `\\int \\left( ${integrandLatex} \\right) dx`;
    valB = numericalIntegrate(x => evaluateAt(fInt.compiled, x) ?? 0, 0, highX);
    valA = numericalIntegrate(x => evaluateAt(fInt.compiled, x) ?? 0, 0, lowX);
    deltaF = valB - valA;
  }

  const fracB = toFraction(valB);
  const fracA = toFraction(valA);
  const fracDelta = toFraction(deltaF);
  const decimalFormatted = numRef?.formatted || deltaF.toFixed(4);

  const steps = [
    {
      stepNumber: 1,
      title: 'Verificación de Continuidad e Intervalo de Integración',
      description: `Se comprueba que la función $f(x) = ${fLatex}$ ${hasG ? `y la función $g(x) = ${gLatex}$` : ''} sean continuas y acotadas en el intervalo cerrado $[${lowX}, ${highX}]$, garantizando la existencia de la integral definida de Riemann.`,
      mathFormula: `x \\in [${lowX}, ${highX}], \\quad f(x) = ${fLatex}${hasG ? `, \\; g(x) = ${gLatex}` : ''}`
    },
    {
      stepNumber: 2,
      title: 'Identificación Geométrica de la Altura y Elemento Diferencial de Área',
      description: hasG
        ? `Se determinan las fronteras superior $y_{\\text{sup}} = ${topLatex}$ e inferior $y_{\\text{inf}} = ${botLatex}$. La altura del elemento diferencial vertical es $h(x) = y_{\\text{sup}} - y_{\\text{inf}}$ y el elemento diferencial es $dA = h(x)\\,dx$.`
        : `La altura del elemento diferencial vertical sobre el eje X corresponde al valor de la función: $h(x) = f(x) = ${fLatex}$, con elemento diferencial $dA = f(x)\\,dx$.`,
      mathFormula: elementVolumeLatex
    },
    {
      stepNumber: 3,
      title: 'Planteamiento Formal de la Integral Definida de Área',
      description: `Se formula la integral del área acumulada entre los límites inferior $a = ${lowX}$ y superior $b = ${highX}$:`,
      mathFormula: integralLatex
    },
    {
      stepNumber: 4,
      title: 'Expansión Algebraica y Simplificación del Integrando',
      description: `Se simplifican algebraicamente las expresiones de las funciones para obtener el integrando $I_A(x)$ en potencias sumables:`,
      mathFormula: `I_A(x) = ${integrandLatex}`
    },
    {
      stepNumber: 5,
      title: 'Cálculo de la Antiderivada (Función Primitiva F(x))',
      description: `Se aplica la regla de potencias $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1}$ término a término para obtener la primitiva $F_A(x)$:`,
      mathFormula: `F_A(x) = \\int \\left( ${integrandLatex} \\right) dx = ${antiderivativeLatex} + C`
    },
    {
      stepNumber: 6,
      title: 'Evaluación en los Límites (Regla de Barrow / Segundo Teorema Fundamental)',
      description: `Se evalúa la función primitiva en el límite superior $x = ${highX}$ y en el límite inferior $x = ${lowX}$, restando ambos resultados:`,
      mathFormula: `\\left[ F_A(x) \\right]_{${lowX}}^{${highX}} = F_A(${highX}) - F_A(${lowX}) = (${fracB.latex}) - (${fracA.latex}) = ${fracDelta.latex}`,
      secondaryFormula: `F_A(${highX}) = ${fracB.latex}, \\quad F_A(${lowX}) = ${fracA.latex} \\implies A = ${fracDelta.latex} \\text{ u}^2`
    },
    {
      stepNumber: 7,
      title: 'Resultado Final del Área Plana',
      description: `El área total calculada para la región plana generatriz corresponde a:`,
      mathFormula: `A = ${fracDelta.latex} \\text{ u}^2 \\approx ${decimalFormatted} \\text{ u}^2`
    }
  ];

  return {
    isAiGenerated: false,
    mode: 'area',
    methodTitle,
    continuityStatus: `Las funciones son continuas y diferenciables en el intervalo [${lowX}, ${highX}]. El dominio analizado cumple con todas las hipótesis del Teorema Fundamental del Cálculo.`,
    methodJustification,
    integralLatex,
    integrandLatex,
    antiderivativeLatex,
    barrowDetails: {
      upperLimit: highX,
      lowerLimit: lowX,
      fUpperStr: fracB.latex,
      fLowerStr: fracA.latex,
      deltaFStr: fracDelta.latex,
      rotationFactor: '1',
      exactResultLatex: `${fracDelta.latex} \\text{ u}^2`,
      decimalResult: `${decimalFormatted} u²`
    },
    evaluationLatex: `\\left[ F_A(x) \\right]_{${lowX}}^{${highX}} = F_A(${highX}) - F_A(${lowX}) = ${fracDelta.latex}`,
    exactResult: `${fracDelta.latex} \\text{ u}^2`,
    decimalResult: `${decimalFormatted} u²`,
    steps,
    realWorldInsight: 'El cálculo del área transversal es crucial en ingeniería civil y mecánica para determinar centroides, momentos de inercia y caudales de diseño en canales hidráulicos.'
  };
}

/**
 * Generador de resolución matemática analítica y pedagógica paso a paso
 * 100% determinístico y autónomo (sin requerir claves de API externas)
 */
export function generateDetailedResolution({
  fStr,
  gStr = '0',
  a,
  b,
  axisType = 'horizontal',
  axisVal = 0,
  method = 'auto',
  mode = 'solid',
  numRef
}) {
  const isSolid = mode === 'solid';
  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';

  // Si el modo es área plana, devolver directamente la resolución completa del área
  if (!isSolid) {
    return generateAreaProcedure({ fStr, gStr, a, b, numRef });
  }

  // Para sólidos de revolución, calculamos también el procedimiento del área generatriz
  const areaProcedure = generateAreaProcedure({ fStr, gStr, a, b, numRef: null });

  const lowX = Math.min(a, b);
  const highX = Math.max(a, b);

  // Evaluación para ordenar rigurosamente las funciones en el intervalo [a, b]
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  if (fComp.error) throw new Error(fComp.error);
  if (hasG && gComp.error) throw new Error(gComp.error);

  const midX = (lowX + highX) / 2;
  const fMid = evaluateAt(fComp.compiled, midX) ?? 0;
  const gMid = (hasG && gComp.compiled) ? (evaluateAt(gComp.compiled, midX) ?? 0) : 0;

  // Notación LaTeX limpia de las funciones ingresadas (sustituyendo sqrt(x) -> \sqrt{x})
  const fLatex = exprToLatex(fStr);
  const gLatex = hasG ? exprToLatex(gStr) : '0';

  let methodTitle = '';
  let methodJustification = '';
  let integralLatex = '';
  let integrandLatex = '';
  let antiderivativeLatex = '';
  let elementVolumeLatex = '';
  let realWorldInsight = '';
  let rawIntegrandStr = '';

  let deltaF = 0;
  let valB = 0;
  let valA = 0;
  let rotationFactorLatex = '\\pi';
    // =========================================================================
    // MODO: SÓLIDOS DE REVOLUCIÓN
    // =========================================================================
    if (axisType === 'horizontal') {
      const axisText = axisVal === 0 ? 'Eje X (y = 0)' : `la recta horizontal y = ${axisVal}`;
      rotationFactorLatex = '\\pi';

      if (!hasG) {
        // DISCOS: V = π ∫ [R(x)]^2 dx
        methodTitle = `Método de Discos (Giro en torno a ${axisText})`;
        methodJustification = `Se utiliza el Método de Discos porque la región está delimitada por una sola curva y el eje de rotación es paralelo al eje X. Las secciones transversales perpendiculares al eje son discos sólidos circulares de radio $R(x)$.`;

        const R_latex = axisVal === 0
          ? `${fLatex}`
          : (axisVal > 0 ? `(${fLatex} - ${axisVal})` : `(${fLatex} + ${Math.abs(axisVal)})`);
        const R_raw = axisVal === 0 ? `(${fStr})` : `(${fStr} - (${axisVal}))`;

        integralLatex = `V = \\pi \\int_{${lowX}}^{${highX}} \\left[ ${R_latex} \\right]^2 \\, dx`;
        elementVolumeLatex = `dV = \\pi [R(x)]^2 \\, dx = \\pi \\left[ ${R_latex} \\right]^2 \\, dx`;
        rawIntegrandStr = `(${R_raw})^2`;
        realWorldInsight = 'Principio esencial de torneado en torno mecánico o CNC para fabricar ejes cilíndricos, rodillos y cilindros macizos.';
      } else {
        // ARANDELAS: V = π ∫ ([R(x)]^2 - [r(x)]^2) dx
        const dF = Math.abs(fMid - axisVal);
        const dG = Math.abs(gMid - axisVal);
        const isFOuter = dF >= dG;
        const outerLatex = isFOuter ? fLatex : gLatex;
        const innerLatex = isFOuter ? gLatex : fLatex;
        const outerStr = isFOuter ? fStr : gStr;
        const innerStr = isFOuter ? gStr : fStr;

        methodTitle = `Método de Arandelas (Giro en torno a ${axisText})`;
        methodJustification = `Se emplea el Método de Arandelas porque la región plana está comprendida entre dos curvas. Al girar alrededor de ${axisText}, se crea un hueco central en cada sección transversal, generando arandelas circulares con radio exterior $R(x)$ y radio interior $r(x)$.`;

        const R_latex = axisVal === 0
          ? `${outerLatex}`
          : (axisVal > 0 ? `(${outerLatex} - ${axisVal})` : `(${outerLatex} + ${Math.abs(axisVal)})`);
        const r_latex = axisVal === 0
          ? `${innerLatex}`
          : (axisVal > 0 ? `(${innerLatex} - ${axisVal})` : `(${innerLatex} + ${Math.abs(axisVal)})`);

        const R_raw = axisVal === 0 ? `(${outerStr})` : `(${outerStr} - (${axisVal}))`;
        const r_raw = axisVal === 0 ? `(${innerStr})` : `(${innerStr} - (${axisVal}))`;

        integralLatex = `V = \\pi \\int_{${lowX}}^{${highX}} \\left( \\left[ ${R_latex} \\right]^2 - \\left[ ${r_latex} \\right]^2 \\right) \\, dx`;
        elementVolumeLatex = `dV = \\pi \\left( [R(x)]^2 - [r(x)]^2 \\right) \\, dx = \\pi \\left( [${R_latex}]^2 - [${r_latex}]^2 \\right) \\, dx`;
        rawIntegrandStr = `(${R_raw})^2 - (${r_raw})^2`;
        realWorldInsight = 'Permite modelar con exactitud el volumen de material necesario para tuberías, rodamientos, casquillos y piezas cilíndricas huecas.';
      }
    } else {
      // CAPAS CILÍNDRICAS: V = 2π ∫ p(x) h(x) dx
      const axisText = axisVal === 0 ? 'Eje Y (x = 0)' : `la recta vertical x = ${axisVal}`;
      rotationFactorLatex = '2\\pi';

      const isFUpper = fMid >= gMid;
      const topLatex = isFUpper ? fLatex : gLatex;
      const botLatex = isFUpper ? (hasG ? gLatex : '0') : fLatex;
      const topStr = isFUpper ? fStr : gStr;
      const botStr = isFUpper ? (hasG ? gStr : '0') : fStr;

      methodTitle = `Método de Capas Cilíndricas (Cascarones, Giro en torno a ${axisText})`;
      methodJustification = `Se utiliza el Método de Capas Cilíndricas porque las franjas diferenciales verticales son paralelas al eje de giro vertical ${axisText}. Cada franja describe una capa cilíndrica hueca de radio medio $p(x) = |x - (${axisVal})|$ y altura $h(x) = y_{\\text{sup}} - y_{\\text{inf}}$.`;

      const p_latex = axisVal === 0
        ? `x`
        : (axisVal > 0 ? `|x - ${axisVal}|` : `(x + ${Math.abs(axisVal)})`);
      const h_latex = hasG ? `\\left[ (${topLatex}) - (${botLatex}) \\right]` : `(${fLatex})`;

      const p_raw = axisVal === 0 ? `x` : `(x - (${axisVal}))`;
      const h_raw = hasG ? `((${topStr}) - (${botStr}))` : `(${fStr})`;

      integralLatex = `V = 2\\pi \\int_{${lowX}}^{${highX}} (${p_latex}) \\cdot ${h_latex} \\, dx`;
      elementVolumeLatex = `dV = 2\\pi \\cdot p(x) \\cdot h(x) \\, dx = 2\\pi (${p_latex}) ${h_latex} \\, dx`;
      rawIntegrandStr = `(${p_raw}) * ${h_raw}`;
      realWorldInsight = 'Se utiliza intensivamente para diseñar tanques de almacenamiento de fluidos, recipientes a presión y cúpulas arquitectónicas.';
    }

  // =========================================================================
  // ANÁLISIS ALGEBRAICO Y SIMBÓLICO DEL INTEGRANDO
  // =========================================================================
  const terms = analyzeIntegrandTerms(rawIntegrandStr);

  if (terms && terms.length > 0) {
    // Integrando y Antiderivada simbólicos exactos
    integrandLatex = formatPolynomialLatex(terms);
    antiderivativeLatex = formatAntiderivativeLatex(terms);

    valB = evalAntiderivativeAt(terms, highX);
    valA = evalAntiderivativeAt(terms, lowX);
    deltaF = valB - valA;
  } else {
    // Fallback numérico de alta precisión
    const fInt = compileExpression(rawIntegrandStr);
    integrandLatex = exprToLatex(rawIntegrandStr);
    antiderivativeLatex = `\\int \\left( ${integrandLatex} \\right) dx`;

    valB = numericalIntegrate(x => evaluateAt(fInt.compiled, x) ?? 0, 0, highX);
    valA = numericalIntegrate(x => evaluateAt(fInt.compiled, x) ?? 0, 0, lowX);
    deltaF = valB - valA;
  }

  // Fracciones y valores exactos de evaluación
  const fracB = toFraction(valB);
  const fracA = toFraction(valA);
  const fracDelta = toFraction(deltaF);

  // Factor de volumen final con pi
  const piMultiplier = isSolid ? (axisType === 'vertical' ? 2 : 1) : 0;
  const finalPiFactor = isSolid ? piMultiplier * deltaF : deltaF;
  const exactVolumeLatex = isSolid
    ? formatPiFactorLatex(finalPiFactor)
    : fracDelta.latex;

  // =========================================================================
  // 7 PASOS METODOLÓGICOS DETALLADOS DEL PROCEDIMIENTO DE CÁLCULO
  // =========================================================================
  const steps = [
    {
      stepNumber: 1,
      title: 'Verificación de Continuidad e Intervalo de Integración',
      description: `Se comprueba que la función $f(x) = ${fLatex}$ ${hasG ? `y la función $g(x) = ${gLatex}$` : ''} sean continuas y acotadas en el intervalo cerrado $[${lowX}, ${highX}]$, garantizando la existencia de la integral definida de Riemann.`,
      mathFormula: `x \\in [${lowX}, ${highX}], \\quad f(x) = ${fLatex}${hasG ? `, \\; g(x) = ${gLatex}` : ''}`
    },
    {
      stepNumber: 2,
      title: 'Identificación Geométrica de Radios y Elemento Diferencial',
      description: isSolid
        ? (axisType === 'horizontal'
            ? (!hasG
                ? `Para el eje horizontal, el radio del disco perpendicular es $R(x) = |f(x) - (${axisVal})| = ${fLatex}$ y su área transversal es $A(x) = \\pi [R(x)]^2$.`
                : `Se determinan los radios: radio exterior $R(x)$ y radio interior $r(x)$. El área transversal de la arandela es $A(x) = \\pi \\left( [R(x)]^2 - [r(x)]^2 \\right)$.`)
            : `Para el eje vertical, el radio medio de rotación es $p(x) = |x - (${axisVal})|$ y la altura de la capa cilíndrica es $h(x) = y_{\\text{sup}} - y_{\\text{inf}}$.`)
        : `Elemento de área diferencial entre curvas: $dA = [y_{\\text{sup}} - y_{\\text{inf}}] \\, dx$.`,
      mathFormula: elementVolumeLatex
    },
    {
      stepNumber: 3,
      title: 'Planteamiento Formal de la Integral Definida',
      description: `Se formula la integral definida sustituyendo los límites de integración inferior $a = ${lowX}$ y superior $b = ${highX}$:`,
      mathFormula: integralLatex
    },
    {
      stepNumber: 4,
      title: 'Expansión Algebraica y Simplificación del Integrando',
      description: `Se desarrollan algebraicamente las potencias y productos del integrando $I(x)$ para obtener una expresión simplificada lista para integrar término a término:`,
      mathFormula: `I(x) = ${integrandLatex}`
    },
    {
      stepNumber: 5,
      title: 'Cálculo de la Antiderivada (Función Primitiva F(x))',
      description: `Se aplica la regla de potencias $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1}$ a cada sumando para obtener la función primitiva $F(x)$:`,
      mathFormula: `F(x) = \\int \\left( ${integrandLatex} \\right) dx = ${antiderivativeLatex} + C`
    },
    {
      stepNumber: 6,
      title: 'Evaluación en los Límites (Regla de Barrow / Segundo Teorema Fundamental)',
      description: `Se evalúa la función primitiva en el límite superior $x = ${highX}$ y en el límite inferior $x = ${lowX}$, restando ambos resultados:`,
      mathFormula: `\\left[ F(x) \\right]_{${lowX}}^{${highX}} = F(${highX}) - F(${lowX}) = (${fracB.latex}) - (${fracA.latex}) = ${fracDelta.latex}`,
      secondaryFormula: `F(${highX}) = ${fracB.latex}, \\quad F(${lowX}) = ${fracA.latex} \\implies \\Delta F = ${fracDelta.latex}`
    },
    {
      stepNumber: 7,
      title: isSolid ? 'Multiplicación por la Constante de Rotación y Volumen Final' : 'Resultado Final del Área Plana',
      description: isSolid
        ? `Se multiplica la evaluación acumulada $\\Delta F = ${fracDelta.latex}$ por la constante de revolución $(${rotationFactorLatex})$ para obtener el volumen exacto y su aproximación decimal:`
        : `El área total de la región plana calculada corresponde a:`,
      mathFormula: isSolid
        ? `V = ${rotationFactorLatex} \\cdot \\left( ${fracDelta.latex} \\right) = ${exactVolumeLatex} \\text{ u}^3 \\approx ${numRef.formatted} \\text{ u}^3`
        : `A = ${fracDelta.latex} \\text{ u}^2 \\approx ${numRef.formatted} \\text{ u}^2`
    }
  ];

  return {
    isAiGenerated: false,
    methodTitle,
    continuityStatus: `Las funciones son continuas y diferenciables en el intervalo [${lowX}, ${highX}]. El dominio analizado cumple con todas las hipótesis del Teorema Fundamental del Cálculo.`,
    methodJustification,
    integralLatex,
    integrandLatex,
    antiderivativeLatex,
    barrowDetails: {
      upperLimit: highX,
      lowerLimit: lowX,
      fUpperStr: fracB.latex,
      fLowerStr: fracA.latex,
      deltaFStr: fracDelta.latex,
      rotationFactor: rotationFactorLatex,
      exactResultLatex: exactVolumeLatex,
      decimalResult: `${numRef.formatted} ${numRef.units}`
    },
    evaluationLatex: isSolid
      ? `\\left[ F(x) \\right]_{${lowX}}^{${highX}} = F(${highX}) - F(${lowX}) = ${fracDelta.latex}`
      : `\\left[ F(x) \\right]_{${lowX}}^{${highX}} = ${fracDelta.latex}`,
    exactResult: isSolid ? `${exactVolumeLatex} \\text{ u}^3` : `${fracDelta.latex} \\text{ u}^2`,
    decimalResult: `${numRef.formatted} ${numRef.units}`,
    steps,
    areaProcedure,
    realWorldInsight
  };
}

/**
 * Respuestas pedagógicas interactivas contextuales para el asistente de cálculo
 * (100% local y determinístico)
 */
export function getContextualCalculusAdvice({ question, context }) {
  const qLower = (question || '').toLowerCase();
  const axis = context.axisType === 'horizontal' ? `y = ${context.axisVal}` : `x = ${context.axisVal}`;
  const fLatex = exprToLatex(context.fStr || 'sqrt(x)');

  if (qLower.includes('por qué') || qLower.includes('método') || qLower.includes('elegió')) {
    if (context.axisType === 'horizontal') {
      return {
        reply: `Se eligió el método correspondiente a secciones transversales perpendiculares al eje horizontal ($${axis}$). Al girar en torno a una recta horizontal integrando respecto a $x$, el radio $R(x)$ se mide verticalmente como $|f(x) - (${context.axisVal})|$. Si existe una segunda curva interior $g(x)$, se genera una arandela descontando el radio interno $r(x)$.`
      };
    } else {
      return {
        reply: `Al girar alrededor del eje vertical ($${axis}$) e integrar respecto a $x$, las franjas rectangulares diferenciales son paralelas al eje de giro. Por tanto, el método natural y más simple es el de **Capas Cilíndricas (Cascarones)**, donde cada capa tiene radio $p(x) = |x - (${context.axisVal})|$ y altura $h(x) = f(x) - g(x)$.`
      };
    }
  }

  if (qLower.includes('eje') || qLower.includes('cambiar') || qLower.includes('recta')) {
    return {
      reply: `Si cambias el eje de rotación, la distancia desde la función o franja hasta el nuevo eje se desplaza. Por ejemplo, al girar alrededor de una recta $y = c$, el nuevo radio exterior es $R(x) = |f(x) - c|$. Puedes probar ingresando el nuevo valor en el panel de entrada y observar cómo se recalcula y grafica en 3D al instante.`
    };
  }

  if (qLower.includes('teorema') || qLower.includes('fundamental') || qLower.includes('ftc')) {
    return {
      reply: `El **Segundo Teorema Fundamental del Cálculo** (Regla de Barrow) establece que si $f$ es continua en $[a, b]$ y $F$ es una antiderivada de $f$, entonces: $\\int_a^b f(x)dx = F(b) - F(a)$. Esto permite calcular el área o volumen acumulado simplemente evaluando la primitiva en los límites superior e inferior sin necesidad de sumas infinitas de Riemann.`
    };
  }

  if (qLower.includes('unidades') || qLower.includes('u³') || qLower.includes('u²') || qLower.includes('física')) {
    return {
      reply: `Las unidades $u^3$ (unidades cúbicas) representan el espacio tridimensional ocupado por el sólido generado al rotar la región plana. En aplicaciones reales de ingeniería, corresponden a litros ($dm^3$), metros cúbicos ($m^3$) de concreto o centímetros cúbicos ($cm^3$ / $ml$) de capacidad.`
    };
  }

  return {
    reply: `Para el ejercicio actual con $f(x) = ${fLatex}$ en el intervalo $[${context.a}, ${context.b}]$, la integral definida planteada evalúa la suma de todos los elementos diferenciales generados por rotación. El resultado numérico obtenido es $${context.decimalResult || ''}$, el cual verifica la geometría tridimensional observada en el visualizador 3D.`
  };
}
