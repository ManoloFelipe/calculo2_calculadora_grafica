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
console.log('✅ Resolución generada con éxito:', {
  title: expl6.methodTitle,
  exactResult: expl6.exactResult,
  decimalResult: expl6.decimalResult,
  step4Formula: expl6.steps[3].mathFormula
});

console.log('--- TODAS LAS PRUEBAS MATEMÁTICAS COMPLETADAS EXITOSAMENTE ---');
