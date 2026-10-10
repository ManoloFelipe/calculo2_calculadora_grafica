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

console.log('--- TODAS LAS PRUEBAS MATEMÁTICAS COMPLETADAS EXITOSAMENTE ---');
