export type CurrencyCode = 'USD' | 'PEN';

export type AcademicCategory =
  | 'Matemáticas y Ciencias'
  | 'Programación y Datos'
  | 'Humanidades y Tesis'
  | 'Negocios y Finanzas'
  | 'Ingeniería'
  | 'Idiomas';

export interface UniversityGradeResult {
  average: number;
  neededForPass: number;
  neededForExcellence: number;
  passedAlready: boolean;
  statusLabel: string;
}

export interface BookingSummaryItem {
  id: string;
  tutorName: string;
  category: string;
  date: string;
  time: string;
  topic: string;
}

export const PEN_EXCHANGE_RATE = 3.75;

/**
 * Formats a USD amount into USD ($X USD) or Peruvian Soles (S/ Y PEN).
 */
export function formatCurrency(
  usdAmount: number,
  currency: CurrencyCode = 'USD',
  exchangeRate: number = PEN_EXCHANGE_RATE
): string {
  const safeUsd = Number.isFinite(usdAmount) ? Math.max(0, usdAmount) : 0;
  if (currency === 'PEN') {
    return `S/ ${Math.round(safeUsd * exchangeRate)} PEN`;
  }
  const formatted = Number.isInteger(safeUsd) ? safeUsd.toString() : safeUsd.toFixed(2);
  return `$${formatted} USD`;
}

/**
 * Calculates total cost in USD for a tutoring booking given hourly rate and duration.
 */
export function calculateBookingTotal(hourlyRateUSD: number, hours: number): number {
  const safeRate = Number.isFinite(hourlyRateUSD) ? Math.max(0, hourlyRateUSD) : 0;
  const safeHours = Number.isFinite(hours) ? Math.max(0.5, hours) : 1;
  return Math.round(safeRate * safeHours * 100) / 100;
}

/**
 * Calculates Peruvian university weighted average on the 0-20 vigesimal scale.
 * Weights: PC (30%), EP (30%), EF (40%). Passing grade: 10.5. Excellence: 16.0.
 */
export function calculateUniversityGrades(
  pcInput: number,
  epInput: number,
  efInput: number
): UniversityGradeResult {
  const clamp20 = (n: number) => (Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 0);
  const pc = clamp20(pcInput);
  const ep = clamp20(epInput);
  const ef = clamp20(efInput);

  const accumulated = pc * 0.3 + ep * 0.3;
  const average = Math.round((accumulated + ef * 0.4) * 100) / 100;
  const rawNeededPass = (10.5 - accumulated) / 0.4;
  const rawNeededExc = (16.0 - accumulated) / 0.4;

  const neededForPass = Math.max(0, Math.round(rawNeededPass * 100) / 100);
  const neededForExcellence = Math.max(0, Math.round(rawNeededExc * 100) / 100);
  const passedAlready = rawNeededPass <= 0;

  let statusLabel = '';
  if (passedAlready) {
    statusLabel = 'Aprobación asegurada con tus notas previas';
  } else if (neededForPass > 20) {
    statusLabel = `Requiere ${neededForPass.toFixed(1)} en el Final (Agenda asesoría intensiva)`;
  } else {
    statusLabel = `Necesitas ${neededForPass.toFixed(2)} en el Examen Final para aprobar (10.5)`;
  }

  return {
    average,
    neededForPass,
    neededForExcellence,
    passedAlready,
    statusLabel,
  };
}

/**
 * Safely evaluates a scientific math expression string (e.g. "(15*4) + sqrt(144)" or "2^8").
 */
export function evaluateScientificExpression(rawExpr: string): { valid: boolean; value: number | null; formatted: string } {
  const trimmed = (rawExpr || '').trim();
  if (!trimmed) {
    return { valid: false, value: null, formatted: '= 0' };
  }
  try {
    const sanitized = trimmed
      .replace(/\^/g, '**')
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/sen\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/log\(/gi, 'Math.log(')
      .replace(/ln\(/gi, 'Math.log(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/\bpi\b/gi, 'Math.PI');

    if (/[^0-9+\-*/().,\sMathsqrtincoantPIlgb*]/.test(sanitized)) {
      return { valid: false, value: null, formatted: '= Expresión inválida' };
    }
    const val = Function('"use strict"; return (' + sanitized + ')')();
    if (typeof val === 'number' && Number.isFinite(val)) {
      const rounded = Number(val.toFixed(4));
      return { valid: true, value: rounded, formatted: `= ${rounded}` };
    }
    return { valid: false, value: null, formatted: '= Error' };
  } catch {
    return { valid: false, value: null, formatted: '= Error de sintaxis' };
  }
}

/**
 * Evaluates f(x) at a given numeric x for the interactive whiteboard function plotter.
 */
export function evaluateMathFunctionAtX(exprRaw: string, xVal: number): number {
  const clean = (exprRaw || 'sin(x)')
    .toLowerCase()
    .trim()
    .replace(/sen\(/g, 'Math.sin(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/log\(/g, 'Math.log(')
    .replace(/exp\(/g, 'Math.exp(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/\^/g, '**');
  try {
    const res = Function('x', '"use strict"; return (' + clean + ');')(xVal);
    return typeof res === 'number' && Number.isFinite(res) ? res : NaN;
  } catch {
    return Math.sin(xVal);
  }
}

/**
 * Detects the academic domain of a user question so advisors never mix unrelated fields.
 */
export function detectAcademicDomain(question: string): AcademicCategory | null {
  const s = (question || '').toLowerCase();
  const scores: Record<AcademicCategory, number> = {
    'Matemáticas y Ciencias': 0,
    'Programación y Datos': 0,
    'Humanidades y Tesis': 0,
    'Negocios y Finanzas': 0,
    'Ingeniería': 0,
    'Idiomas': 0,
  };

  if (
    /(derivad|integral|l[ií]mite|ecuaci[oó]n|matriz|matrices|autovalor|polinomio|sen\(|sin\(|cos\(|tan\(|ln\(|log|c[aá]lculo|vector|riemann|laplace|taylor|f\(x\)|x\^2|x\^3|pit[aá]goras|geometr[ií]a|trigonometr[ií]a|f[ií]sica|cinem[aá]tica|velocidad|aceleraci[oó]n|fuerza|newton|qu[ií]mica|mol\b|ph\b|probabilidad|estad[ií]stica|\d+\s*[+\-*/^=]\s*\d+)/i.test(
      s
    )
  ) {
    scores['Matemáticas y Ciencias'] += 5;
  }
  if (
    /(python|javascript|java\b|c\+\+|sql|select|join|where|group by|having|lista|tupla|diccionario|algoritmo|complejidad|big-o|o\(n|grafo|bfs|dfs|recursiv|c[oó]digo|programar|programaci[oó]n|bucle|for\b|while\b|funci[oó]n|clase|objeto|poo|array|pandas|machine learning|react|html|css|api|json|crud|b[uú]squeda binaria)/i.test(
      s
    )
  ) {
    scores['Programación y Datos'] += 5;
  }
  if (
    /(tesis|apa\b|et al|cita|citaci[oó]n|bibliograf|problema general|objetivo general|hip[oó]tesis|matriz de consistencia|muestra|poblaci[oó]n|pearson|spearman|cronbach|turnitin|estado del arte|marco te[oó]rico|transversal|cuasi|metodolog|ensayo|redacci[oó]n|justificaci[oó]n|antecedentes)/i.test(
      s
    )
  ) {
    scores['Humanidades y Tesis'] += 5;
  }
  if (
    /(van\b|vpn\b|tir\b|wacc|flujo de caja|inter[eé]s compuesto|inter[eé]s simple|tasa efectiva|tea\b|tem\b|amortizaci[oó]n|ebitda|balance general|estado de resultados|punto de equilibrio|finanza|contabilidad|rentabilidad|activo|pasivo|patrimonio|oferta|demanda|inflaci[oó]n|marketing|costos)/i.test(
      s
    )
  ) {
    scores['Negocios y Finanzas'] += 5;
  }
  if (
    /(est[aá]tica|din[aá]mica|cuerpo libre|dcl|momento flector|fuerza cortante|esfuerzo|deformaci[oó]n|hooke|young|termodin[aá]mica|entalp[ií]a|entrop[ií]a|rankine|carnot|bernoulli|reynolds|viga|armadura|kirchhoff|ohm|circuito|voltaje|corriente|resistencia|fluidos|mec[aá]nica)/i.test(
      s
    )
  ) {
    scores['Ingeniería'] += 5;
  }
  if (
    /(toefl|ielts|english|ingl[eé]s|essay|writing|speaking|phrasal verb|conditional|passive voice|present perfect|past simple|verb to be|although|despite|linking words|grammar|pronunciaci[oó]n|traducir|traducci[oó]n|how to say|vocabulary)/i.test(
      s
    )
  ) {
    scores['Idiomas'] += 5;
  }

  let bestCat: AcademicCategory | null = null;
  let bestScore = 0;
  (Object.keys(scores) as AcademicCategory[]).forEach((k) => {
    if (scores[k] > bestScore) {
      bestScore = scores[k];
      bestCat = k;
    }
  });
  return bestCat;
}

/**
 * Solves direct math expressions, percentages, linear equations, and quadratic equations step by step.
 */
export function solveDirectMathQuestion(q: string): string | null {
  const s = (q || '').toLowerCase().replace(/,/g, '.');

  // 1. Percentage: "X% de Y"
  const pctMatch = s.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de|of)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const p = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = Number(((p / 100) * total).toFixed(4));
    return (
      `El **${p}% de ${total}** es **${res}**.\n\n` +
      `• **Cálculo directo:** (${p} ÷ 100) × ${total} = ${p / 100} × ${total} = **${res}**.`
    );
  }

  // 2. Quadratic equation: ax^2 + bx + c = 0
  const quadMatch = s.match(/([+-]?\d*)\s*x\^2\s*([+-]\s*\d+)\s*x\s*([+-]\s*\d+)\s*=\s*0/);
  if (quadMatch) {
    const a =
      quadMatch[1] === '' || quadMatch[1] === '+'
        ? 1
        : quadMatch[1] === '-'
        ? -1
        : parseFloat(quadMatch[1]);
    const b = parseFloat(quadMatch[2].replace(/\s+/g, ''));
    const c = parseFloat(quadMatch[3].replace(/\s+/g, ''));
    const disc = b * b - 4 * a * c;
    if (disc > 0) {
      const r1 = Number(((-b + Math.sqrt(disc)) / (2 * a)).toFixed(4));
      const r2 = Number(((-b - Math.sqrt(disc)) / (2 * a)).toFixed(4));
      return (
        `Para la ecuación cuadrática **${quadMatch[0]}**, las raíces reales son **x₁ = ${r1}** y **x₂ = ${r2}**.\n\n` +
        `• **Paso 1 (Coeficientes):** a = ${a}, b = ${b}, c = ${c}\n` +
        `• **Paso 2 (Discriminante Δ = b² - 4ac):** Δ = (${b})² - 4(${a})(${c}) = ${disc}\n` +
        `• **Paso 3 (Fórmula general):** x = (${-b} ± √${disc}) / ${2 * a} ⇒ **x₁ = ${r1}**, **x₂ = ${r2}**.`
      );
    } else if (disc === 0) {
      const r0 = Number((-b / (2 * a)).toFixed(4));
      return `La ecuación **${quadMatch[0]}** tiene una única solución real (raíz doble): **x = ${r0}** (Δ = 0).`;
    } else {
      return `La ecuación **${quadMatch[0]}** no tiene raíces reales en ℝ porque su discriminante es negativo (Δ = ${disc}). Sus raíces complejas conjugadas son **x = (${-b} ± i√${Math.abs(disc)}) / ${2 * a}**.`;
    }
  }

  // 3. Linear equation: ax + b = c
  const linMatch = s.match(
    /(?:^|\s)([+-]?\d*)\s*x\s*([+-]\s*\d+(?:\.\d+)?)\s*=\s*([+-]?\d+(?:\.\d+)?)(?:\s|$|\?)/
  );
  if (linMatch && !/x\^2/.test(s)) {
    const aL =
      linMatch[1] === '' || linMatch[1] === '+'
        ? 1
        : linMatch[1] === '-'
        ? -1
        : parseFloat(linMatch[1]);
    const bL = parseFloat(linMatch[2].replace(/\s+/g, ''));
    const cL = parseFloat(linMatch[3]);
    const rhs = cL - bL;
    const xVal = Number((rhs / aL).toFixed(4));
    return (
      `El valor de **x** en la ecuación lineal es **${xVal}**.\n\n` +
      `• **Paso 1:** Despejamos el término independiente: ${aL}x = ${cL} ${bL >= 0 ? '- ' + bL : '+ ' + Math.abs(bL)} ⇒ ${aL}x = ${rhs}\n` +
      `• **Paso 2:** Dividimos entre ${aL}: x = ${rhs} / ${aL} = **${xVal}**.`
    );
  }

  return null;
}

/**
 * Generates a high-precision, domain-isolated academic explanation when running locally or offline.
 */
export function generateSpecialistAcademicResponse(
  question: string,
  targetCategory: string,
  advisorName: string,
  tags: string[] = []
): string {
  const raw = (question || '').trim();
  const s = raw.toLowerCase();
  const detectedCat = detectAcademicDomain(raw);
  const effectiveCat = detectedCat || targetCategory || 'Matemáticas y Ciencias';
  const domainNotice =
    detectedCat && targetCategory && detectedCat !== targetCategory
      ? `*(Nota: Consultaste a ${advisorName} de ${targetCategory}, pero como tu pregunta corresponde a **${detectedCat}** te respondo con rigor de esa especialidad)*:\n\n`
      : '';

  if (/^(hola|buenos d[ií]as|buenas tardes|buenas noches|buenas|hey|saludos|qu[eé] tal|c[oó]mo est[aá]s)[?!.\s]*$/i.test(s)) {
    const specList = tags.length > 0 ? tags.join(', ') : effectiveCat;
    return (
      `¡Hola! Soy **${advisorName}**, tu asesor especializado en **${effectiveCat}** (${specList}).\n\n` +
      `Envíame cualquier problema, ecuación, consulta de código o duda metodológica; te responderé paso a paso y transcribiré el esquema directamente en la Pizarra Digital.`
    );
  }

  const directMath = solveDirectMathQuestion(raw);
  if (directMath) {
    return domainNotice + directMath;
  }

  if (effectiveCat === 'Programación y Datos') {
    if (/(sql|join|inner|left|group by|having|where|select)/i.test(s)) {
      return (
        domainNotice +
        `En **SQL Analítico**, la diferencia clave radica en el momento de filtrado y cruce:\n\n` +
        `• **\`WHERE\` vs \`HAVING\`:** \`WHERE\` filtra filas individuales *antes* de \`GROUP BY\`; \`HAVING\` filtra los grupos ya agregados (ej. \`HAVING COUNT(*) > 1\`).\n` +
        `• **\`LEFT JOIN\`:** Si colocas una condición sobre la tabla derecha en el \`WHERE\`, eliminas los \`NULL\` y lo conviertes en un \`INNER JOIN\`. Coloca esa condición dentro de la cláusula \`ON\`.\n` +
        `\`\`\`sql\nSELECT c.nombre, COUNT(p.id) AS total_pedidos\nFROM clientes c\nLEFT JOIN pedidos p ON c.id = p.cliente_id AND p.activo = 1\nGROUP BY c.id, c.nombre\nHAVING COUNT(p.id) >= 1;\n\`\`\``
      );
    }
    if (/(lista|tupla|diccionario|set\b|hash|complejidad|big-o|o\(1\))/i.test(s)) {
      return (
        domainNotice +
        `Comparativa de estructuras en **Python** y complejidad **Big-O**:\n\n` +
        `• **Lista (\`list\` \`[]\`):** Mutable y secuencial. Acceso por índice \`O(1)\`, búsqueda lineal \`x in lista\` en \`O(n)\`.\n` +
        `• **Tupla (\`tuple\` \`()\`):** Inmutable, menor huella de memoria y apta como clave en diccionarios.\n` +
        `• **Diccionario (\`dict\` \`{}\`) y Conjunto (\`set\`):** Implementados sobre tablas hash; búsqueda, inserción y borrado promedio en tiempo constante **\`O(1)\`**.`
      );
    }
    return (
      domainNotice +
      `Resolución algorítmica en **Programación y Datos**:\n\n` +
      `• **Estructura recomendada:** Valida casos borde al inicio, utiliza estructuras hash (\`dict\`/\`set\`) para evitar bucles anidados \`O(n²)\` y modulariza la lógica.\n` +
      `\`\`\`python\ndef procesar_datos(elementos: list[float]) -> dict[str, float]:\n    if not elementos:\n        return {"promedio": 0.0, "maximo": 0.0}\n    return {\n        "promedio": round(sum(elementos) / len(elementos), 2),\n        "maximo": max(elementos)\n    }\n\`\`\``
    );
  }

  if (effectiveCat === 'Humanidades y Tesis') {
    if (/(apa|cita|et al|referencia|bibliograf)/i.test(s)) {
      return (
        domainNotice +
        `Reglas oficiales de citación en **Normas APA 7ma Edición**:\n\n` +
        `• **1 o 2 autores:** Se citan ambos apellidos en todas las menciones: *(Arias & Covinos, 2023)*.\n` +
        `• **3 o más autores:** Desde la **primera mención** se escribe solo el primer apellido seguido de *et al.*: *Hernández-Sampieri et al. (2023)*.\n` +
        `• **Cita directa corta (< 40 palabras):** Entre comillas dentro del párrafo indicando número de página \`(p. 45)\`.\n` +
        `• **Cita en bloque (≥ 40 palabras):** En párrafo aparte con sangría izquierda de 1.27 cm y sin comillas.`
      );
    }
    return (
      domainNotice +
      `Ruta metodológica para **Investigación y Tesis Universitaria**:\n\n` +
      `1. **Matriz de Consistencia:** El Problema General, Objetivo General e Hipótesis General deben conservar exactamente las mismas variables, población y temporalidad.\n` +
      `2. **Prueba de Normalidad:** Usa *Shapiro-Wilk* para muestras \`n ≤ 50\` o *Kolmogorov-Smirnov* para \`n > 50\`.\n` +
      `3. **Contraste de Hipótesis:** Si hay normalidad (\`p > 0.05\`), aplica **R de Pearson**; si los datos son ordinales (escala Likert) o no normales, aplica **Rho de Spearman**.`
    );
  }

  if (effectiveCat === 'Negocios y Finanzas') {
    return (
      domainNotice +
      `Análisis de Evaluación Financiera (**VAN, TIR y Flujo de Caja**):\n\n` +
      `• **Valor Actual Neto (VAN):** Descuenta los flujos futuros al costo de oportunidad (\`COK\` / \`WACC\`) y resta la inversión inicial \`I₀\`: \`VAN = ∑ [FC_t / (1 + COK)^t] - I₀\`. Si **VAN > 0**, el proyecto genera valor económico.\n` +
      `• **Tasa Interna de Retorno (TIR):** Tasa que hace \`VAN = 0\`. El proyecto se acepta siempre que **TIR > COK**.\n` +
      `• **Fórmula en Excel:** \`=VNA(COK; B2:F2) - Inversión_Inicial\`.`
    );
  }

  if (effectiveCat === 'Ingeniería') {
    return (
      domainNotice +
      `Procedimiento de análisis en **Ingeniería Aplicada**:\n\n` +
      `1. **Diagrama de Cuerpo Libre (DCL):** Aísla el elemento estructural o volumen de control e identifica reacciones de apoyo y cargas distribuidas.\n` +
      `2. **Ecuaciones Fundamentales:** Aplica equilibrio estático (\`∑Fx = 0\`, \`∑Fy = 0\`, \`∑Mz = 0\`) o Primera Ley de la Termodinámica (\`Q̇ - Ẇ = ∑ṁ_s·h_s - ∑ṁ_e·h_e\`).\n` +
      `3. **Verificación Dimensional:** Trabaja estrictamente en unidades del Sistema Internacional (\`N, Pa, m, kg, J\`).`
    );
  }

  if (effectiveCat === 'Idiomas') {
    return (
      domainNotice +
      `Guía de **Inglés Académico (TOEFL iBT / IELTS Academic)**:\n\n` +
      `• **Contraste Gramatical (\`Although\` vs \`Despite\`):**\n` +
      `  - **Although / Even though** + \`Sujeto + Verbo\`: *Although the sample size was small, the results were significant.*\n` +
      `  - **Despite / In spite of** + \`Sustantivo / Verbo en -ing\`: *Despite having a small sample size, the study succeeded.*\n` +
      `• **Conectores de Alto Puntaje:** *Furthermore, Nevertheless, Consequently, In light of the evidence presented.*`
    );
  }

  // Default: Matemáticas y Ciencias
  if (/(derivad|derivar|d\/dx|f'\(x\)|tangente)/i.test(s)) {
    const polyMatch = s.match(/(\d*)\s*x\^(\d+)/);
    const polyStep = polyMatch
      ? `\n• **Aplicado a tu término \`${polyMatch[0].trim()}\`:** \`d/dx [${polyMatch[0].trim()}] = ${(polyMatch[1] ? parseInt(polyMatch[1], 10) : 1) * parseInt(polyMatch[2], 10)}x^${parseInt(polyMatch[2], 10) - 1}\`.`
      : '';
    return (
      domainNotice +
      `En **Cálculo Diferencial**, la derivada representa la pendiente de la recta tangente y la tasa de cambio instantánea:\n\n` +
      `• **Regla de la Potencia:** \`d/dx [xⁿ] = n · xⁿ⁻¹\`\n` +
      `• **Regla de la Cadena:** \`d/dx [f(g(x))] = f'(g(x)) · g'(x)\`\n` +
      `• **Producto y Cociente:** \`(u·v)' = u'v + u·v'\`  |  \`(u/v)' = (u'v - u·v') / v²\`${polyStep}`
    );
  }

  if (/(integral|integrar|∫|ilate|por partes|sustituci[oó]n)/i.test(s)) {
    return (
      domainNotice +
      `En **Cálculo Integral**, selecciona la técnica según la estructura del integrando:\n\n` +
      `1. **Potencia directa:** \`∫ xⁿ dx = xⁿ⁺¹ / (n + 1) + C\` (\`n ≠ -1\`).\n` +
      `2. **Sustitución simple (\`u\`):** Cuando aparece una función compuesta multiplicada por su derivada interna.\n` +
      `3. **Integración por Partes (\`∫ u dv = u·v - ∫ v du\`):** Para productos de funciones trascendentes, eligiendo \`u\` según la prioridad **ILATE** (Inversa, Logarítmica, Algebraica, Trigonométrica, Exponencial).`
    );
  }

  return (
    domainNotice +
    `Desarrollo paso a paso en **${effectiveCat}**:\n\n` +
    `1. **Planteamiento:** Identificamos las variables de entrada, el dominio de definición y las condiciones de contorno de **"${raw}"**.\n` +
    `2. **Propiedad Fundamental:** Aplicamos el teorema o relación analítica directa verificando consistencia de signos y unidades.\n` +
    `3. **Comprobación:** Sustituimos la solución obtenida en la expresión original para confirmar la identidad.`
  );
}

/**
 * Extracts structured, concise whiteboard notes from an AI tutor response.
 */
export function extractBoardNotesFromReply(
  question: string,
  replyText: string,
  advisorName: string,
  category: string
): string {
  const clean = String(replyText || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const header = `APUNTES DE PIZARRA — ${advisorName} (${category})\nConsulta: ${question}\n`;
  const bodyLines = lines.slice(0, 8).map((l) => (/^[•\-1-9]/.test(l) ? l : `• ${l}`));
  return header + bodyLines.join('\n');
}

/**
 * Generates an RFC-5545 compliant .ICS calendar string from the user's scheduled bookings.
 */
export function generateIcsCalendarContent(bookings: BookingSummaryItem[]): string {
  const items =
    bookings && bookings.length > 0
      ? bookings
      : [
          {
            id: 'bk-default',
            tutorName: 'Dr. Alejandro Vargas',
            category: 'Matemáticas y Ciencias',
            date: '2026-11-10',
            time: '05:00 PM',
            topic: 'Asesoría Académica EduNexus',
          },
        ];

  const events = items.map((bk, idx) => {
    const cleanDate = (bk.date || '2026-11-10').replace(/-/g, '');
    return [
      'BEGIN:VEVENT',
      `UID:edunexus-${bk.id || idx}@edunexus.cloud`,
      'DTSTAMP:20261109T120000Z',
      `DTSTART:${cleanDate}T220000Z`,
      `DTEND:${cleanDate}T230000Z`,
      `SUMMARY:Asesoría Online: ${bk.topic} (${bk.tutorName})`,
      `DESCRIPTION:Sesión 100% online en el Aula Virtual de EduNexus Cloud (${bk.category}). Horario: ${bk.time}`,
      'LOCATION:Aula Virtual EduNexus Cloud',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduNexus Cloud//Agenda Academica//ES',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
