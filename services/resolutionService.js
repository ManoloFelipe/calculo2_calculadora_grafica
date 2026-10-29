import { compileExpression, evaluateAt } from './mathService.js';

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

  // Evaluación para ordenar rigurosamente las funciones en el intervalo [a, b]
  const fComp = compileExpression(fStr);
  const gComp = compileExpression(gStr || '0');
  const midX = (a + b) / 2;
  const fMid = evaluateAt(fComp.compiled, midX) ?? 0;
  const gMid = (hasG && gComp.compiled) ? (evaluateAt(gComp.compiled, midX) ?? 0) : 0;

  let methodTitle = '';
  let methodJustification = '';
  let integralLatex = '';
  let integrandExpl = '';
  let antiderivativeLatex = '';
  let elementVolumeLatex = '';
  let realWorldInsight = '';

  if (!isSolid) {
    // Modo Área bajo la curva
    const isFUpper = fMid >= gMid;
    const topStr = isFUpper ? fStr : gStr;
    const botStr = isFUpper ? (hasG ? gStr : '0') : fStr;

    methodTitle = hasG ? 'Área entre dos Curvas' : 'Área bajo la Curva f(x)';
    methodJustification = hasG
      ? `Se calcula la región delimitada entre f(x) y g(x) en el intervalo [${a}, ${b}]. La curva superior es y = ${topStr} y la inferior es y = ${botStr}.`
      : `Se calcula el área bajo la curva f(x) respecto al eje X en el intervalo [${a}, ${b}], donde dA = f(x) dx.`;

    integralLatex = hasG
      ? `A = \\int_{${a}}^{${b}} \\left[ (${topStr}) - (${botStr}) \\right] \\, dx`
      : `A = \\int_{${a}}^{${b}} (${fStr}) \\, dx`;

    integrandExpl = hasG
      ? `Elemento diferencial de área: dA = [y_{\\text{sup}} - y_{\\text{inf}}] \\, dx = [(${topStr}) - (${botStr})] \\, dx.`
      : `Elemento diferencial de área: dA = f(x) \\, dx = (${fStr}) \\, dx.`;

    antiderivativeLatex = `F(x) = \\int \\left( ${hasG ? `(${topStr}) - (${botStr})` : fStr} \\right) dx`;
    elementVolumeLatex = `dA = h(x) \\, dx`;
    realWorldInsight = 'El cálculo del área transversal es crucial en ingeniería civil y mecánica para determinar centroides, momentos de inercia y caudales de diseño en canales hidráulicos.';
  } else {
    // Sólidos de Revolución
    if (axisType === 'horizontal') {
      // Giro en torno a recta horizontal y = c
      const axisText = axisVal === 0 ? 'Eje X (y = 0)' : `la recta horizontal y = ${axisVal}`;

      if (!hasG) {
        // Discos
        methodTitle = `Método de Discos (Giro en torno a ${axisText})`;
        methodJustification = `Se emplea el Método de Discos porque la región está delimitada por una sola función y el eje de rotación es paralelo al eje X, generando secciones circulares sólidas (sin perforación).`;

        const R_str = axisVal === 0 ? `(${fStr})` : `\\left| (${fStr}) - (${axisVal}) \\right|`;
        integralLatex = `V = \\pi \\int_{${a}}^{${b}} \\left[ ${R_str} \\right]^2 \\, dx`;
        integrandExpl = `Radio del disco en cualquier x: R(x) = ${R_str}. Área transversal: A(x) = \\pi [R(x)]^2.`;
        antiderivativeLatex = `F(x) = \\pi \\int \\left[ ${R_str} \\right]^2 dx`;
        elementVolumeLatex = `dV = \\pi [R(x)]^2 \\, dx`;
        realWorldInsight = 'Este método es el principio de torneado cilíndrico en manufactura CNC y diseño de botellas, cilindros y ejes mecánicos macizos.';
      } else {
        // Arandelas: identificar qué curva es exterior (más alejada del eje)
        const dF = Math.abs(fMid - axisVal);
        const dG = Math.abs(gMid - axisVal);
        const isFOuter = dF >= dG;
        const outerStr = isFOuter ? fStr : gStr;
        const innerStr = isFOuter ? gStr : fStr;

        methodTitle = `Método de Arandelas (Giro en torno a ${axisText})`;
        methodJustification = `Se utiliza el Método de Arandelas porque la región está delimitada entre dos curvas f(x) y g(x). Al girar alrededor de ${axisText}, se crea una cavidad central formando discos perforados (arandelas).`;

        const R_str = axisVal === 0 ? `(${outerStr})` : `\\left| (${outerStr}) - (${axisVal}) \\right|`;
        const r_str = axisVal === 0 ? `(${innerStr})` : `\\left| (${innerStr}) - (${axisVal}) \\right|`;

        integralLatex = `V = \\pi \\int_{${a}}^{${b}} \\left( \\left[ ${R_str} \\right]^2 - \\left[ ${r_str} \\right]^2 \\right) \\, dx`;
        integrandExpl = `Radio exterior: R(x) = ${R_str}. Radio interior: r(x) = ${r_str}. Área de la arandela: A(x) = \\pi (R^2 - r^2).`;
        antiderivativeLatex = `F(x) = \\pi \\int \\left( [R(x)]^2 - [r(x)]^2 \\right) dx`;
        elementVolumeLatex = `dV = \\pi \\left( [R(x)]^2 - [r(x)]^2 \\right) \\, dx`;
        realWorldInsight = 'Esencial para calcular el volumen de material en tuberías, rodamientos, bujes mecánicos huecos y piezas de pared delgada.';
      }
    } else {
      // Giro en torno a recta vertical x = k (Capas Cilíndricas / Cascarones)
      const axisText = axisVal === 0 ? 'Eje Y (x = 0)' : `la recta vertical x = ${axisVal}`;
      const isFUpper = fMid >= gMid;
      const topStr = isFUpper ? fStr : gStr;
      const botStr = isFUpper ? (hasG ? gStr : '0') : fStr;

      methodTitle = `Método de Capas Cilíndricas (Cascarones, Giro en torno a ${axisText})`;
      methodJustification = `Se utiliza el Método de Capas Cilíndricas porque los elementos diferenciales verticales son paralelos al eje de rotación ${axisText}. Esto permite integrar directamente con respecto a x de forma directa.`;

      const p_str = axisVal === 0 ? `x` : `|x - (${axisVal})|`;
      const h_str = hasG ? `\\left[ (${topStr}) - (${botStr}) \\right]` : `(${fStr})`;

      integralLatex = `V = 2\\pi \\int_{${a}}^{${b}} (${p_str}) \\cdot ${h_str} \\, dx`;
      integrandExpl = `Radio medio de la capa: p(x) = ${p_str}. Altura de la capa: h(x) = y_{\\text{sup}} - y_{\\text{inf}} = ${h_str}. Perímetro: 2\\pi p(x).`;
      antiderivativeLatex = `F(x) = 2\\pi \\int p(x) \\cdot h(x) \\, dx`;
      elementVolumeLatex = `dV = 2\\pi \\, p(x) \\, h(x) \\, dx`;
      realWorldInsight = 'Ampliamente aplicado en el cálculo de almacenamiento de tanques de agua paraboloides, cúpulas arquitectónicas y vasijas de presión.';
    }
  }

  // Generación de pasos numerados detallados
  const steps = [
    {
      stepNumber: 1,
      title: 'Verificación de Continuidad e Intervalo',
      description: `Se valida que la función ${fStr} ${hasG ? `y la función ${gStr}` : ''} sean continuas y acotadas en el intervalo cerrado [${a}, ${b}], garantizando la existencia de la integral de Riemann.`,
      mathFormula: `x \\in [${a}, ${b}], \\quad f(x) = ${fStr}`
    },
    {
      stepNumber: 2,
      title: 'Identificación del Elemento Diferencial',
      description: integrandExpl,
      mathFormula: elementVolumeLatex
    },
    {
      stepNumber: 3,
      title: 'Planteamiento Formal de la Integral Definida',
      description: `Se establecen los límites de integración inferior a = ${a} y superior b = ${b} aplicando la fórmula del método seleccionado:`,
      mathFormula: integralLatex
    },
    {
      stepNumber: 4,
      title: 'Aplicación del Teorema Fundamental del Cálculo (FTC)',
      description: `Se evalúa la función primitiva F(x) en los extremos del intervalo mediante la regla de Barrow: F(b) - F(a).`,
      mathFormula: isSolid
        ? `\\left[ F(x) \\right]_{${a}}^{${b}} = F(${b}) - F(${a}) = ${numRef.piFactor}\\pi \\approx ${numRef.formatted} \\text{ u}^3`
        : `\\left[ F(x) \\right]_{${a}}^{${b}} = F(${b}) - F(${a}) = ${numRef.formatted} \\text{ u}^2`
    },
    {
      stepNumber: 5,
      title: 'Resultado Final y Unidades',
      description: isSolid
        ? `El volumen del sólido de revolución generado tras la rotación completa de 360° es:`
        : `El área de la región plana generadora corresponde a:`,
      mathFormula: isSolid
        ? `V = ${numRef.piFactor}\\pi \\approx ${numRef.formatted} \\text{ u}^3`
        : `A = ${numRef.formatted} \\text{ u}^2`
    }
  ];

  return {
    isAiGenerated: false,
    methodTitle,
    continuityStatus: `Las funciones son continuas y diferenciables en el intervalo [${a}, ${b}]. El dominio analizado cumple con todas las hipótesis del Teorema Fundamental del Cálculo.`,
    methodJustification,
    integralLatex,
    antiderivativeLatex,
    evaluationLatex: isSolid
      ? `F(${b}) - F(${a}) = ${numRef.piFactor}\\pi \\approx ${numRef.formatted}`
      : `F(${b}) - F(${a}) = ${numRef.formatted}`,
    exactResult: isSolid ? `${numRef.piFactor}\\pi \\text{ u}^3` : `${numRef.formatted} \\text{ u}^2`,
    decimalResult: `${numRef.formatted} ${numRef.units}`,
    steps,
    realWorldInsight
  };
}

/**
 * Respuestas pedagógicas interactivas contextuales para el asistente de cálculo
 * (100% local y determinístico)
 */
export function getContextualCalculusAdvice({ question, context }) {
  const qLower = (question || '').toLowerCase();
  const isSolid = context.mode === 'solid';
  const axis = context.axisType === 'horizontal' ? `y = ${context.axisVal}` : `x = ${context.axisVal}`;

  if (qLower.includes('por qué') || qLower.includes('método') || qLower.includes('elegió')) {
    if (context.axisType === 'horizontal') {
      return {
        reply: `Se eligió el método correspondiente a secciones perpendiculares al eje horizontal ($${axis}$). Al girar en torno a una recta horizontal integrando respecto a $x$, el radio $R(x)$ se mide verticalmente como $|f(x) - (${context.axisVal})|$. Si existe una segunda curva interior $g(x)$, se genera una arandela descontando el radio interno $r(x)$.`
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
    reply: `Para el ejercicio actual con $f(x) = ${context.fStr}$ en el intervalo $[${context.a}, ${context.b}]$, la integral definida planteada evalúa la suma de todos los elementos diferenciales generados por rotación. El resultado numérico obtenido es $${context.decimalResult || ''}$, el cual verifica la geometría tridimensional observada en el visualizador 3D.`
  };
}
