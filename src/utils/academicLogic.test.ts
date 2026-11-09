import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  calculateBookingTotal,
  calculateUniversityGrades,
  evaluateScientificExpression,
  evaluateMathFunctionAtX,
  detectAcademicDomain,
  solveDirectMathQuestion,
  generateSpecialistAcademicResponse,
  extractBoardNotesFromReply,
  generateIcsCalendarContent,
} from './academicLogic';

test('formatCurrency formats USD and PEN accurately', () => {
  assert.equal(formatCurrency(20, 'USD'), '$20 USD');
  assert.equal(formatCurrency(20, 'PEN', 3.75), 'S/ 75 PEN');
  assert.equal(formatCurrency(22.5, 'USD'), '$22.50 USD');
});

test('calculateBookingTotal computes hourly rate multiplied by duration', () => {
  assert.equal(calculateBookingTotal(20, 1.5), 30);
  assert.equal(calculateBookingTotal(25, 2), 50);
});

test('calculateUniversityGrades calculates 0-20 weighted average and required final score', () => {
  const res = calculateUniversityGrades(13, 11, 14);
  // 13*0.3 (3.9) + 11*0.3 (3.3) + 14*0.4 (5.6) = 12.80
  assert.equal(res.average, 12.8);
  // (10.5 - 7.2) / 0.4 = 8.25
  assert.equal(res.neededForPass, 8.25);
  assert.equal(res.passedAlready, false);

  const highGrades = calculateUniversityGrades(18, 18, 18);
  assert.equal(highGrades.passedAlready, true);
  assert.equal(highGrades.neededForPass, 0);
});

test('evaluateScientificExpression evaluates valid math and rejects invalid input', () => {
  const r1 = evaluateScientificExpression('(15*4) + sqrt(144)');
  assert.equal(r1.valid, true);
  assert.equal(r1.value, 72);
  assert.equal(r1.formatted, '= 72');

  const r2 = evaluateScientificExpression('2^8');
  assert.equal(r2.valid, true);
  assert.equal(r2.value, 256);

  const bad = evaluateScientificExpression('alert(1)');
  assert.equal(bad.valid, false);
});

test('evaluateMathFunctionAtX computes trigonometric and polynomial values', () => {
  assert.equal(evaluateMathFunctionAtX('x^2 - 4', 3), 5);
  assert.equal(Math.round(evaluateMathFunctionAtX('cos(x)', 0)), 1);
});

test('detectAcademicDomain classifies questions into strict academic domains', () => {
  assert.equal(detectAcademicDomain('¿Cómo derivar f(x) = x^3 + sen(x)?'), 'Matemáticas y Ciencias');
  assert.equal(detectAcademicDomain('¿Por qué mi consulta SQL con LEFT JOIN falla en Python?'), 'Programación y Datos');
  assert.equal(detectAcademicDomain('¿Cómo citar 3 autores en Normas APA 7 para mi tesis?'), 'Humanidades y Tesis');
  assert.equal(detectAcademicDomain('¿Cómo calcular el VAN y la TIR de un flujo de caja?'), 'Negocios y Finanzas');
});

test('solveDirectMathQuestion solves quadratic and linear equations accurately', () => {
  const quad = solveDirectMathQuestion('x^2 - 5x + 6 = 0');
  assert.ok(quad);
  assert.ok(quad.includes('x₁ = 3'));
  assert.ok(quad.includes('x₂ = 2'));

  const lin = solveDirectMathQuestion('2x + 4 = 10');
  assert.ok(lin);
  assert.ok(lin.includes('**3**'));
});

test('generateSpecialistAcademicResponse and extractBoardNotesFromReply produce structured output', () => {
  const reply = generateSpecialistAcademicResponse(
    '¿Cuándo usar LEFT JOIN vs INNER JOIN en SQL?',
    'Programación y Datos',
    'Ing. Sofía Huamán',
    ['Python', 'SQL']
  );
  assert.ok(reply.includes('SQL'));
  const board = extractBoardNotesFromReply('SQL JOINs', reply, 'Ing. Sofía Huamán', 'Programación y Datos');
  assert.ok(board.includes('APUNTES DE PIZARRA'));
});

test('generateIcsCalendarContent builds valid VCALENDAR string', () => {
  const ics = generateIcsCalendarContent([
    {
      id: 'bk-1',
      tutorName: 'Dr. Alejandro Vargas',
      category: 'Matemáticas y Ciencias',
      date: '2026-11-12',
      time: '05:00 PM',
      topic: 'Cálculo Vectorial',
    },
  ]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Asesoría Online: Cálculo Vectorial (Dr. Alejandro Vargas)'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});

test('buildGoogleSitesStandaloneHtml generates self-contained HTML with embedded state', async () => {
  const { buildGoogleSitesStandaloneHtml } = await import('./googleSitesExport.ts');
  const { DEFAULT_TUTORS, DEFAULT_COURSES, DEFAULT_NOTES, DEFAULT_BOOKINGS } = await import('../data/seedData.ts');
  const html = buildGoogleSitesStandaloneHtml({
    tutors: DEFAULT_TUTORS,
    courses: DEFAULT_COURSES,
    notes: DEFAULT_NOTES,
    bookings: DEFAULT_BOOKINGS,
    currency: 'PEN',
    liveAppUrl: 'https://example.run.app',
  });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('Dr. Alejandro Vargas'));
  assert.ok(html.includes('Google Sites Interactive Edition'));
  assert.ok(html.includes('</html>'));
});

