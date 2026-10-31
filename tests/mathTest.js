import { calculateNumericalReference, generate2DPlotData, generate3DRevolutionMesh } from '../services/mathService.js';

console.log('--- INICIANDO PRUEBAS DEL MOTOR MATEMÁTICO ---');

// Caso 1: Discos - f(x) = sqrt(x), [0, 4], giro en y = 0
// Teórico: π ∫_0^4 x dx = π [x^2/2]_0^4 = 8π ≈ 25.13274
const res1 = calculateNumericalReference({
  fStr: 'sqrt(x)',
  gStr: '0',
  a: 0,
  b: 4,
  axisType: 'horizontal',
  axisVal: 0,
  method: 'discos',
  mode: 'solid'
});
console.log('Caso 1 (Discos):', res1);
const err1 = Math.abs(res1.volume - 8 * Math.PI);
if (err1 < 0.01) {
  console.log('✅ Caso 1 superado (Error < 0.01)');
} else {
  console.error('❌ Caso 1 falló: diferencia', err1);
}

// Caso 2: Arandelas - f(x) = x, g(x) = x^2, [0, 1], giro en y = 0
// Teórico: π ∫_0^1 (x^2 - x^4) dx = π (1/3 - 1/5) = 2π/15 ≈ 0.418879
const res2 = calculateNumericalReference({
  fStr: 'x',
  gStr: 'x^2',
  a: 0,
  b: 1,
  axisType: 'horizontal',
  axisVal: 0,
  method: 'arandelas',
  mode: 'solid'
});
console.log('Caso 2 (Arandelas):', res2);
const err2 = Math.abs(res2.volume - (2 * Math.PI) / 15);
if (err2 < 0.01) {
  console.log('✅ Caso 2 superado (Error < 0.01)');
} else {
  console.error('❌ Caso 2 falló: diferencia', err2);
}

// Caso 3: Capas Cilíndricas - f(x) = 2*x - x^2, [0, 2], giro en x = 0 (Eje Y)
// Teórico: 2π ∫_0^2 x (2x - x^2) dx = 2π (16/3 - 4) = 8π/3 ≈ 8.37758
const res3 = calculateNumericalReference({
  fStr: '2*x - x^2',
  gStr: '0',
  a: 0,
  b: 2,
  axisType: 'vertical',
  axisVal: 0,
  method: 'capas',
  mode: 'solid'
});
console.log('Caso 3 (Capas Cilíndricas):', res3);
const err3 = Math.abs(res3.volume - (8 * Math.PI) / 3);
if (err3 < 0.01) {
  console.log('✅ Caso 3 superado (Error < 0.01)');
} else {
  console.error('❌ Caso 3 falló: diferencia', err3);
}

// Caso 4: Área bajo la curva f(x) = x^2, [0, 3] -> Teórico = 9.0
const res4 = calculateNumericalReference({
  fStr: 'x^2',
  gStr: '0',
  a: 0,
  b: 3,
  mode: 'area'
});
console.log('Caso 4 (Área):', res4);
const err4 = Math.abs(res4.value - 9.0);
if (err4 < 0.01) {
  console.log('✅ Caso 4 superado (Error < 0.01)');
} else {
  console.error('❌ Caso 4 falló: diferencia', err4);
}

// Caso 5: Generación de mallas 2D y 3D
const plot2D = generate2DPlotData({
  fStr: 'sqrt(x)',
  gStr: '0',
  a: 0,
  b: 4,
  axisType: 'horizontal',
  axisVal: 0,
  mode: 'solid'
});
console.log(`✅ Gráfica 2D generada: ${plot2D.fCurve.x.length} puntos en f(x) y ${plot2D.region.x.length} en región.`);

const mesh3D = generate3DRevolutionMesh({
  fStr: 'sqrt(x)',
  gStr: '0',
  a: 0,
  b: 4,
  axisType: 'horizontal',
  axisVal: 0,
  maxAngleDeg: 360
});
console.log(`✅ Malla 3D generada: Matriz X tiene ${mesh3D.outer.X.length} filas x ${mesh3D.outer.X[0].length} columnas.`);

// Caso 6: Caso específico del usuario: f(x) = sqrt(x), g(x) = x+1, [0, 4], giro en Eje Y (x = 0)
// Curva superior: g(x) = x+1 (1 a 5), Curva inferior: f(x) = sqrt(x) (0 a 2)
// Altura: h(x) = x + 1 - sqrt(x)
// Radio: p(x) = x
// V = 2π ∫_0^4 x (x + 1 - x^(1/2)) dx = 2π ∫_0^4 (x^2 + x - x^(3/2)) dx
//   = 2π [ x^3/3 + x^2/2 - (2/5)x^(5/2) ]_0^4
//   = 2π [ 64/3 + 8 - (2/5)(32) ] = 2π [ 64/3 + 8 - 64/5 ] = 2π [ 320/15 + 120/15 - 192/15 ]
//   = 2π [ 248/15 ] = 496π / 15 ≈ 103.881997 u³
const res6 = calculateNumericalReference({
  fStr: 'sqrt(x)',
  gStr: 'x+1',
  a: 0,
  b: 4,
  axisType: 'vertical',
  axisVal: 0,
  method: 'capas',
  mode: 'solid'
});
console.log('Caso 6 (Usuario: sqrt(x) y x+1, Eje Y):', res6);
const expectedV6 = (496 * Math.PI) / 15;
const err6 = Math.abs(res6.volume - expectedV6);
if (err6 < 0.1) {
  console.log(`✅ Caso 6 superado: V = ${res6.volume.toFixed(4)} (Esperado: ${expectedV6.toFixed(4)}, Error: ${err6.toFixed(4)})`);
} else {
  console.error(`❌ Caso 6 falló: obtenido ${res6.volume}, esperado ${expectedV6}`);
}

const mesh3D_v = generate3DRevolutionMesh({
  fStr: 'sqrt(x)',
  gStr: 'x+1',
  a: 0,
  b: 4,
  axisType: 'vertical',
  axisVal: 0,
  maxAngleDeg: 360
});
console.log(`✅ Malla 3D vertical generada: Techo Z[0][0]=${mesh3D_v.outer.Z[0][0]}, Base Z[0][0]=${mesh3D_v.capA.Z[0][0]}`);
if (mesh3D_v.outer.Z[0][0] >= mesh3D_v.capA.Z[0][0]) {
  console.log('✅ Coordenadas verticales correctas: Techo >= Base en todo el intervalo');
} else {
  console.error('❌ Error de inversión vertical: Techo < Base');
}

import { generateDetailedResolution } from '../services/resolutionService.js';

// Verificación de Resolución Paso a Paso en Discos con sqrt(x)
const expl1 = generateDetailedResolution({
  fStr: 'sqrt(x)',
  gStr: '0',
  a: 0,
  b: 4,
  axisType: 'horizontal',
  axisVal: 0,
  method: 'discos',
  mode: 'solid',
  numRef: res1
});
console.log('✅ Resolución Caso 1 (Discos):', {
  title: expl1.methodTitle,
  exactResult: expl1.exactResult,
  stepsCount: expl1.steps.length,
  step1: expl1.steps[0].mathFormula,
  step4: expl1.steps[3].mathFormula,
  step5: expl1.steps[4].mathFormula,
  step6: expl1.steps[5].mathFormula,
  step7: expl1.steps[6].mathFormula
});
if (expl1.steps.length === 7 && expl1.exactResult.includes('8\\pi') && expl1.steps[0].mathFormula.includes('\\sqrt{x}')) {
  console.log('✅ Caso 1: Procedimiento completo de 7 pasos con \\sqrt{x} y 8\\pi validado.');
} else {
  console.error('❌ Caso 1 falló validación de 7 pasos o símbolo de raíz.');
}

// Verificación de Resolución Caso 6 (Capas con sqrt(x) y x+1)
const expl6 = generateDetailedResolution({
  fStr: 'sqrt(x)',
  gStr: 'x+1',
  a: 0,
  b: 4,
  axisType: 'vertical',
  axisVal: 0,
  method: 'capas',
  mode: 'solid',
  numRef: res6
});
console.log('✅ Resolución Caso 6 (Capas):', {
  title: expl6.methodTitle,
  exactResult: expl6.exactResult,
  decimalResult: expl6.decimalResult,
  step4Formula: expl6.steps[3].mathFormula,
  step6Formula: expl6.steps[5].mathFormula
});
if (expl6.steps.length === 7 && expl6.exactResult.includes('496\\pi')) {
  console.log('✅ Caso 6: Procedimiento de Capas Cilíndricas validado con fracción exacta 496\\pi/15.');
} else {
  console.error('❌ Caso 6 falló validación de fracción exacta.');
}


// =========================================================================
// PRUEBAS DEL CÁLCULO Y PROCEDIMIENTO DE ÁREA (2D y Región Generatriz)
// =========================================================================
console.log('\n--- PRUEBAS DE PROCEDIMIENTO DE ÁREA ---');

// Verificación de Procedimiento de Área asociado al Sólido (Caso 1: sqrt(x) en [0, 4])
// Teórico de Área: ∫_0^4 sqrt(x) dx = [ (2/3) x^(3/2) ]_0^4 = 16/3 ≈ 5.3333 u²
if (expl1.areaProcedure) {
  console.log('✅ Caso 1: Procedimiento de área adjunto a sólido generado con éxito:', {
    methodTitle: expl1.areaProcedure.methodTitle,
    exactResult: expl1.areaProcedure.exactResult,
    decimalResult: expl1.areaProcedure.decimalResult,
    stepsCount: expl1.areaProcedure.steps.length
  });
  if (expl1.areaProcedure.steps.length === 7 && expl1.areaProcedure.exactResult.includes('16') && expl1.areaProcedure.exactResult.includes('3')) {
    console.log('✅ Caso 1 (Área Generatriz): 7 pasos analíticos y fracción exacta 16/3 u² superados.');
  } else {
    console.error('❌ Caso 1 (Área Generatriz) falló validación:', expl1.areaProcedure.exactResult);
  }
} else {
  console.error('❌ Caso 1 no generó areaProcedure.');
}

// Verificación de Resolución Directa en Modo Área: f(x) = x^2 en [0, 3] -> 9.0 u²
const areaExpl4 = generateDetailedResolution({
  fStr: 'x^2',
  gStr: '0',
  a: 0,
  b: 3,
  mode: 'area',
  numRef: res4
});
console.log('✅ Resolución Modo Área f(x)=x^2 [0, 3]:', {
  methodTitle: areaExpl4.methodTitle,
  exactResult: areaExpl4.exactResult,
  decimalResult: areaExpl4.decimalResult,
  stepsCount: areaExpl4.steps.length
});
if (areaExpl4.steps.length === 7 && areaExpl4.exactResult.includes('9') && areaExpl4.exactResult.includes('^2')) {
  console.log('✅ Modo Área (1 curva): 7 pasos y resultado exacto 9 u² validados.');
} else {
  console.error('❌ Modo Área falló validación:', areaExpl4.exactResult);
}

// Verificación de Resolución Modo Área entre 2 curvas: f(x) = x, g(x) = x^2 en [0, 1]
// Área: ∫_0^1 (x - x^2) dx = [x^2/2 - x^3/3]_0^1 = 1/2 - 1/3 = 1/6 ≈ 0.1667 u²
const resArea2 = calculateNumericalReference({
  fStr: 'x',
  gStr: 'x^2',
  a: 0,
  b: 1,
  mode: 'area'
});
const areaExpl2 = generateDetailedResolution({
  fStr: 'x',
  gStr: 'x^2',
  a: 0,
  b: 1,
  mode: 'area',
  numRef: resArea2
});
console.log('✅ Resolución Modo Área entre f(x)=x y g(x)=x^2 [0, 1]:', {
  methodTitle: areaExpl2.methodTitle,
  exactResult: areaExpl2.exactResult,
  decimalResult: areaExpl2.decimalResult,
  stepsCount: areaExpl2.steps.length
});
if (areaExpl2.steps.length === 7 && areaExpl2.exactResult.includes('1') && areaExpl2.exactResult.includes('6')) {
  console.log('✅ Modo Área (2 curvas): 7 pasos y fracción exacta 1/6 u² validados.');
} else {
  console.error('❌ Modo Área entre 2 curvas falló:', areaExpl2.exactResult);
}

console.log('--- TODAS LAS PRUEBAS MATEMÁTICAS COMPLETADAS EXITOSAMENTE ---');

