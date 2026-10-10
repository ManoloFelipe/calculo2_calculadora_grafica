import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Obtiene la instancia del cliente Gemini si la clave está configurada
 */
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'tu_api_key_aqui') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });
}

/**
 * Fallback matemático determinístico cuando no hay API Key o falla la red
 */
function generateFallbackResolution({
  fStr,
  gStr,
  a,
  b,
  axisType,
  axisVal,
  method,
  mode,
  numRef
}) {
  const isSolid = mode === 'solid';
  const hasG = gStr && gStr.trim() !== '' && gStr.trim() !== '0';

  let methodTitle = 'Cálculo de Área bajo la Curva';
  let integralLatex = `\\int_{${a}}^{${b}} (${fStr}) \\, dx`;
  let integrandExpl = `f(x) = ${fStr}`;

  if (isSolid) {
    if (axisType === 'horizontal') {
      if (!hasG) {
        methodTitle = `Método de Discos (Giro en torno a ${axisVal === 0 ? 'Eje X' : `y = ${axisVal}`})`;
        const R_expr = axisVal === 0 ? `(${fStr})` : `(${fStr} - ${axisVal})`;
        integralLatex = `V = \\pi \\int_{${a}}^{${b}} [${R_expr}]^2 \\, dx`;
        integrandExpl = `Radio del disco: R(x) = ${R_expr}. El elemento diferencial de volumen es dV = \\pi [R(x)]^2 dx.`;
      } else {
        methodTitle = `Método de Arandelas (Giro en torno a ${axisVal === 0 ? 'Eje X' : `y = ${axisVal}`})`;
        const R_expr = axisVal === 0 ? `(${fStr})` : `(${fStr} - ${axisVal})`;
        const r_expr = axisVal === 0 ? `(${gStr})` : `(${gStr} - ${axisVal})`;
        integralLatex = `V = \\pi \\int_{${a}}^{${b}} \\left( [${R_expr}]^2 - [${r_expr}]^2 \\right) \\, dx`;
        integrandExpl = `Radio exterior: R(x) = ${R_expr}, Radio interior: r(x) = ${r_expr}. Área de la arandela: A(x) = \\pi (R^2 - r^2).`;
      }
    } else {
      methodTitle = `Método de Capas Cilíndricas (Cascarones, Giro en torno a ${axisVal === 0 ? 'Eje Y' : `x = ${axisVal}`})`;
      const p_expr = axisVal === 0 ? `x` : `|x - ${axisVal}|`;
      const h_expr = hasG ? `(${fStr} - (${gStr}))` : `(${fStr})`;
      integralLatex = `V = 2\\pi \\int_{${a}}^{${b}} (${p_expr}) \\cdot [${h_expr}] \\, dx`;
      integrandExpl = `Radio medio de la capa: p(x) = ${p_expr}, Altura de la capa: h(x) = ${h_expr}. El volumen diferencial es dV = 2\\pi p(x) h(x) dx.`;
    }
  }

  return {
    isAiGenerated: false,
    methodTitle,
    continuityStatus: `Las funciones son continuas en el intervalo cerrado [${a}, ${b}], cumpliendo con las condiciones para la integrabilidad de Riemann.`,
    methodJustification: `Se seleccionó ${methodTitle} porque las secciones transversales al eje de giro son uniformes y la integración respecto a x permite una evaluación analítica directa.`,
    integralLatex,
    antiderivativeLatex: `F(x) = \\int \\text{integrando} \\, dx`,
    evaluationLatex: `F(${b}) - F(${a}) \\approx ${numRef.formatted}`,
    exactResult: isSolid ? `${numRef.piFactor}\\pi \\text{ u}^3` : `${numRef.formatted} \\text{ u}^2`,
    decimalResult: `${numRef.formatted} ${numRef.units}`,
    steps: [
      {
        stepNumber: 1,
        title: 'Verificación del dominio y continuidad',
        description: `Se valida que la función ${fStr} esté bien definida y no tenga asíntotas verticales ni discontinuidades esenciales en el intervalo [${a}, ${b}].`,
        mathFormula: `x \\in [${a}, ${b}]`
      },
      {
        stepNumber: 2,
        title: 'Identificación geométrica del elemento diferencial',
        description: integrandExpl,
        mathFormula: isSolid ? `dV = \\dots` : `dA = f(x) dx`
      },
      {
        stepNumber: 3,
        title: 'Planteamiento de la integral definida',
        description: 'Se ensambla la integral con los límites de integración inferior y superior especificados.',
        mathFormula: integralLatex
      },
      {
        stepNumber: 4,
        title: 'Integración y Teorema Fundamental del Cálculo',
        description: 'Se evalúa la primitiva en los límites de integración superior e inferior: F(b) - F(a).',
        mathFormula: `\\left[ F(x) \\right]_{${a}}^{${b}} = F(${b}) - F(${a}) = ${numRef.formatted}`
      },
      {
        stepNumber: 5,
        title: 'Resultado final con unidades',
        description: `El resultado final ${isSolid ? 'del volumen del sólido' : 'del área bajo la curva'} corresponde a:`,
        mathFormula: isSolid ? `V = ${numRef.formatted} \\text{ u}^3` : `A = ${numRef.formatted} \\text{ u}^2`
      }
    ],
    realWorldInsight: 'Este procedimiento es la base del diseño paramétrico por revolución utilizado en software CAD (SolidWorks, AutoCAD) y para calcular capacidades en recipientes a presión y tanques de almacenamiento.'
  };
}

/**
 * Consulta a Gemini para obtener una resolución estructurada y pedagógica
 */
export async function explainWithGemini({
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
  const model = getGeminiModel();
  if (!model) {
    return generateFallbackResolution({
      fStr,
      gStr,
      a,
      b,
      axisType,
      axisVal,
      method,
      mode,
      numRef
    });
  }

  const prompt = `
Eres un profesor universitario experto en Cálculo II para estudiantes de Ingeniería en Sistemas.
Analiza y resuelve con todo el rigor pedagógico y matemático el siguiente ejercicio de ${mode === 'solid' ? 'SÓLIDO DE REVOLUCIÓN' : 'ÁREA BAJO LA CURVA'}:

DATOS:
- Función f(x): ${fStr}
- Función g(x) (si aplica): ${gStr || '0'}
- Límites de integración: a = ${a}, b = ${b}
- Tipo de eje: ${axisType} (horizontal y=${axisVal} o vertical x=${axisVal})
- Valor del eje: ${axisVal}
- Método sugerido: ${method}
- Valor numérico aproximado de referencia: ${numRef.formatted} ${numRef.units} (factor de pi: ${numRef.piFactor || 'N/A'})

INSTRUCCIONES:
1. Verifica la continuidad de las funciones en el intervalo [${a}, ${b}].
2. Determina y justifica el mejor método de cálculo (Discos, Arandelas o Capas Cilíndricas).
3. Deduce el radio exterior R(x), radio interior r(x) o radio medio p(x) y altura h(x).
4. Plantea formalmente la integral definida en notación LaTeX limpia (sin delimiters de bloque dobles dentro de cadenas, solo código LaTeX).
5. Encuentra la antiderivada (primitiva) simbólica.
6. Aplica el Teorema Fundamental del Cálculo evaluando en los límites F(b) - F(a).
7. Expresa el resultado analítico exacto (manteniendo \\pi como símbolo si es sólido) y su aproximación decimal con las unidades (${mode === 'solid' ? 'u³' : 'u²'}).
8. Proporciona una explicación de aplicación práctica en la ingeniería (diseño industrial, estructuras, arquitectura o física).

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
{
  "isAiGenerated": true,
  "methodTitle": "string (nombre del método y eje)",
  "continuityStatus": "string (análisis de continuidad en [a, b])",
  "methodJustification": "string (por qué se usa este método)",
  "integralLatex": "string (expresión formal de la integral en LaTeX)",
  "antiderivativeLatex": "string (la primitiva F(x) en LaTeX)",
  "evaluationLatex": "string (evaluación F(b) - F(a) en LaTeX)",
  "exactResult": "string (resultado analítico en LaTeX, ej: \\frac{32\\pi}{5} u^3)",
  "decimalResult": "string (valor decimal con unidades)",
  "steps": [
    {
      "stepNumber": 1,
      "title": "string",
      "description": "string",
      "mathFormula": "string (fórmula en LaTeX)"
    }
  ],
  "realWorldInsight": "string (contexto aplicado en ingeniería)"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    parsed.isAiGenerated = true;
    return parsed;
  } catch (error) {
    console.warn('Error llamando a Gemini API, usando fallback matemático:', error.message);
    return generateFallbackResolution({
      fStr,
      gStr,
      a,
      b,
      axisType,
      axisVal,
      method,
      mode,
      numRef
    });
  }
}

/**
 * Tutor interactivo de Cálculo II con Gemini
 */
export async function askTutorQuestion({ question, context }) {
  const model = getGeminiModel();
  if (!model) {
    return {
      reply: 'El Asistente Tutor IA está en modo demostración. Para habilitar respuestas conversacionales personalizadas, configura tu clave GEMINI_API_KEY en el archivo .env del servidor.',
      isAiAvailable: false
    };
  }

  const prompt = `
Eres el Tutor Virtual de Cálculo II para estudiantes de Ingeniería en Sistemas.
Estás asesorando a un estudiante sobre el siguiente problema de cálculo:
CONTEXTO DEL PROBLEMA ACTUAL:
- Tipo: ${context.mode === 'solid' ? 'Sólido de Revolución' : 'Área bajo la curva'}
- Función f(x): ${context.fStr}
- Función g(x): ${context.gStr || '0'}
- Intervalo: [${context.a}, ${context.b}]
- Eje: ${context.axisType === 'horizontal' ? `y = ${context.axisVal}` : `x = ${context.axisVal}`}
- Método: ${context.method}
- Resultado: ${context.decimalResult || ''}

PREGUNTA DEL ESTUDIANTE:
"${question}"

INSTRUCCIONES:
- Responde de manera clara, didáctica, precisa y motivadora.
- Si usas fórmulas matemáticas, enciérralas en notación LaTeX estándar (por ejemplo: $V = \\pi \\int_a^b r(x)^2 dx$).
- Mantén la respuesta concisa pero pedagógicamente completa.
`;

  try {
    const result = await model.generateContent(prompt);
    return {
      reply: result.response.text(),
      isAiAvailable: true
    };
  } catch (error) {
    return {
      reply: `Hubo una dificultad al consultar a Gemini: ${error.message}. Por favor intenta de nuevo.`,
      isAiAvailable: false
    };
  }
}
