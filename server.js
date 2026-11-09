var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");

// src/utils/academicLogic.ts
function detectAcademicDomain(question) {
  const s = (question || "").toLowerCase();
  const scores = {
    "Matem\xE1ticas y Ciencias": 0,
    "Programaci\xF3n y Datos": 0,
    "Humanidades y Tesis": 0,
    "Negocios y Finanzas": 0,
    "Ingenier\xEDa": 0,
    "Idiomas": 0
  };
  if (/(derivad|integral|l[ií]mite|ecuaci[oó]n|matriz|matrices|autovalor|polinomio|sen\(|sin\(|cos\(|tan\(|ln\(|log|c[aá]lculo|vector|riemann|laplace|taylor|f\(x\)|x\^2|x\^3|pit[aá]goras|geometr[ií]a|trigonometr[ií]a|f[ií]sica|cinem[aá]tica|velocidad|aceleraci[oó]n|fuerza|newton|qu[ií]mica|mol\b|ph\b|probabilidad|estad[ií]stica|\d+\s*[+\-*/^=]\s*\d+)/i.test(
    s
  )) {
    scores["Matem\xE1ticas y Ciencias"] += 5;
  }
  if (/(python|javascript|java\b|c\+\+|sql|select|join|where|group by|having|lista|tupla|diccionario|algoritmo|complejidad|big-o|o\(n|grafo|bfs|dfs|recursiv|c[oó]digo|programar|programaci[oó]n|bucle|for\b|while\b|funci[oó]n|clase|objeto|poo|array|pandas|machine learning|react|html|css|api|json|crud|b[uú]squeda binaria)/i.test(
    s
  )) {
    scores["Programaci\xF3n y Datos"] += 5;
  }
  if (/(tesis|apa\b|et al|cita|citaci[oó]n|bibliograf|problema general|objetivo general|hip[oó]tesis|matriz de consistencia|muestra|poblaci[oó]n|pearson|spearman|cronbach|turnitin|estado del arte|marco te[oó]rico|transversal|cuasi|metodolog|ensayo|redacci[oó]n|justificaci[oó]n|antecedentes)/i.test(
    s
  )) {
    scores["Humanidades y Tesis"] += 5;
  }
  if (/(van\b|vpn\b|tir\b|wacc|flujo de caja|inter[eé]s compuesto|inter[eé]s simple|tasa efectiva|tea\b|tem\b|amortizaci[oó]n|ebitda|balance general|estado de resultados|punto de equilibrio|finanza|contabilidad|rentabilidad|activo|pasivo|patrimonio|oferta|demanda|inflaci[oó]n|marketing|costos)/i.test(
    s
  )) {
    scores["Negocios y Finanzas"] += 5;
  }
  if (/(est[aá]tica|din[aá]mica|cuerpo libre|dcl|momento flector|fuerza cortante|esfuerzo|deformaci[oó]n|hooke|young|termodin[aá]mica|entalp[ií]a|entrop[ií]a|rankine|carnot|bernoulli|reynolds|viga|armadura|kirchhoff|ohm|circuito|voltaje|corriente|resistencia|fluidos|mec[aá]nica)/i.test(
    s
  )) {
    scores["Ingenier\xEDa"] += 5;
  }
  if (/(toefl|ielts|english|ingl[eé]s|essay|writing|speaking|phrasal verb|conditional|passive voice|present perfect|past simple|verb to be|although|despite|linking words|grammar|pronunciaci[oó]n|traducir|traducci[oó]n|how to say|vocabulary)/i.test(
    s
  )) {
    scores["Idiomas"] += 5;
  }
  let bestCat = null;
  let bestScore = 0;
  Object.keys(scores).forEach((k) => {
    if (scores[k] > bestScore) {
      bestScore = scores[k];
      bestCat = k;
    }
  });
  return bestCat;
}
function solveDirectMathQuestion(q) {
  const s = (q || "").toLowerCase().replace(/,/g, ".");
  const pctMatch = s.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de|of)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const p = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = Number((p / 100 * total).toFixed(4));
    return `El **${p}% de ${total}** es **${res}**.

\u2022 **C\xE1lculo directo:** (${p} \xF7 100) \xD7 ${total} = ${p / 100} \xD7 ${total} = **${res}**.`;
  }
  const quadMatch = s.match(/([+-]?\d*)\s*x\^2\s*([+-]\s*\d+)\s*x\s*([+-]\s*\d+)\s*=\s*0/);
  if (quadMatch) {
    const a = quadMatch[1] === "" || quadMatch[1] === "+" ? 1 : quadMatch[1] === "-" ? -1 : parseFloat(quadMatch[1]);
    const b = parseFloat(quadMatch[2].replace(/\s+/g, ""));
    const c = parseFloat(quadMatch[3].replace(/\s+/g, ""));
    const disc = b * b - 4 * a * c;
    if (disc > 0) {
      const r1 = Number(((-b + Math.sqrt(disc)) / (2 * a)).toFixed(4));
      const r2 = Number(((-b - Math.sqrt(disc)) / (2 * a)).toFixed(4));
      return `Para la ecuaci\xF3n cuadr\xE1tica **${quadMatch[0]}**, las ra\xEDces reales son **x\u2081 = ${r1}** y **x\u2082 = ${r2}**.

\u2022 **Paso 1 (Coeficientes):** a = ${a}, b = ${b}, c = ${c}
\u2022 **Paso 2 (Discriminante \u0394 = b\xB2 - 4ac):** \u0394 = (${b})\xB2 - 4(${a})(${c}) = ${disc}
\u2022 **Paso 3 (F\xF3rmula general):** x = (${-b} \xB1 \u221A${disc}) / ${2 * a} \u21D2 **x\u2081 = ${r1}**, **x\u2082 = ${r2}**.`;
    } else if (disc === 0) {
      const r0 = Number((-b / (2 * a)).toFixed(4));
      return `La ecuaci\xF3n **${quadMatch[0]}** tiene una \xFAnica soluci\xF3n real (ra\xEDz doble): **x = ${r0}** (\u0394 = 0).`;
    } else {
      return `La ecuaci\xF3n **${quadMatch[0]}** no tiene ra\xEDces reales en \u211D porque su discriminante es negativo (\u0394 = ${disc}). Sus ra\xEDces complejas conjugadas son **x = (${-b} \xB1 i\u221A${Math.abs(disc)}) / ${2 * a}**.`;
    }
  }
  const linMatch = s.match(
    /(?:^|\s)([+-]?\d*)\s*x\s*([+-]\s*\d+(?:\.\d+)?)\s*=\s*([+-]?\d+(?:\.\d+)?)(?:\s|$|\?)/
  );
  if (linMatch && !/x\^2/.test(s)) {
    const aL = linMatch[1] === "" || linMatch[1] === "+" ? 1 : linMatch[1] === "-" ? -1 : parseFloat(linMatch[1]);
    const bL = parseFloat(linMatch[2].replace(/\s+/g, ""));
    const cL = parseFloat(linMatch[3]);
    const rhs = cL - bL;
    const xVal = Number((rhs / aL).toFixed(4));
    return `El valor de **x** en la ecuaci\xF3n lineal es **${xVal}**.

\u2022 **Paso 1:** Despejamos el t\xE9rmino independiente: ${aL}x = ${cL} ${bL >= 0 ? "- " + bL : "+ " + Math.abs(bL)} \u21D2 ${aL}x = ${rhs}
\u2022 **Paso 2:** Dividimos entre ${aL}: x = ${rhs} / ${aL} = **${xVal}**.`;
  }
  return null;
}
function generateSpecialistAcademicResponse(question, targetCategory, advisorName, tags = []) {
  const raw = (question || "").trim();
  const s = raw.toLowerCase();
  const detectedCat = detectAcademicDomain(raw);
  const effectiveCat = detectedCat || targetCategory || "Matem\xE1ticas y Ciencias";
  const domainNotice = detectedCat && targetCategory && detectedCat !== targetCategory ? `*(Nota: Consultaste a ${advisorName} de ${targetCategory}, pero como tu pregunta corresponde a **${detectedCat}** te respondo con rigor de esa especialidad)*:

` : "";
  if (/^(hola|buenos d[ií]as|buenas tardes|buenas noches|buenas|hey|saludos|qu[eé] tal|c[oó]mo est[aá]s)[?!.\s]*$/i.test(s)) {
    const specList = tags.length > 0 ? tags.join(", ") : effectiveCat;
    return `\xA1Hola! Soy **${advisorName}**, tu asesor especializado en **${effectiveCat}** (${specList}).

Env\xEDame cualquier problema, ecuaci\xF3n, consulta de c\xF3digo o duda metodol\xF3gica; te responder\xE9 paso a paso y transcribir\xE9 el esquema directamente en la Pizarra Digital.`;
  }
  const directMath = solveDirectMathQuestion(raw);
  if (directMath) {
    return domainNotice + directMath;
  }
  if (effectiveCat === "Programaci\xF3n y Datos") {
    if (/(sql|join|inner|left|group by|having|where|select)/i.test(s)) {
      return domainNotice + `En **SQL Anal\xEDtico**, la diferencia clave radica en el momento de filtrado y cruce:

\u2022 **\`WHERE\` vs \`HAVING\`:** \`WHERE\` filtra filas individuales *antes* de \`GROUP BY\`; \`HAVING\` filtra los grupos ya agregados (ej. \`HAVING COUNT(*) > 1\`).
\u2022 **\`LEFT JOIN\`:** Si colocas una condici\xF3n sobre la tabla derecha en el \`WHERE\`, eliminas los \`NULL\` y lo conviertes en un \`INNER JOIN\`. Coloca esa condici\xF3n dentro de la cl\xE1usula \`ON\`.
\`\`\`sql
SELECT c.nombre, COUNT(p.id) AS total_pedidos
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id AND p.activo = 1
GROUP BY c.id, c.nombre
HAVING COUNT(p.id) >= 1;
\`\`\``;
    }
    if (/(lista|tupla|diccionario|set\b|hash|complejidad|big-o|o\(1\))/i.test(s)) {
      return domainNotice + `Comparativa de estructuras en **Python** y complejidad **Big-O**:

\u2022 **Lista (\`list\` \`[]\`):** Mutable y secuencial. Acceso por \xEDndice \`O(1)\`, b\xFAsqueda lineal \`x in lista\` en \`O(n)\`.
\u2022 **Tupla (\`tuple\` \`()\`):** Inmutable, menor huella de memoria y apta como clave en diccionarios.
\u2022 **Diccionario (\`dict\` \`{}\`) y Conjunto (\`set\`):** Implementados sobre tablas hash; b\xFAsqueda, inserci\xF3n y borrado promedio en tiempo constante **\`O(1)\`**.`;
    }
    return domainNotice + `Resoluci\xF3n algor\xEDtmica en **Programaci\xF3n y Datos**:

\u2022 **Estructura recomendada:** Valida casos borde al inicio, utiliza estructuras hash (\`dict\`/\`set\`) para evitar bucles anidados \`O(n\xB2)\` y modulariza la l\xF3gica.
\`\`\`python
def procesar_datos(elementos: list[float]) -> dict[str, float]:
    if not elementos:
        return {"promedio": 0.0, "maximo": 0.0}
    return {
        "promedio": round(sum(elementos) / len(elementos), 2),
        "maximo": max(elementos)
    }
\`\`\``;
  }
  if (effectiveCat === "Humanidades y Tesis") {
    if (/(apa|cita|et al|referencia|bibliograf)/i.test(s)) {
      return domainNotice + `Reglas oficiales de citaci\xF3n en **Normas APA 7ma Edici\xF3n**:

\u2022 **1 o 2 autores:** Se citan ambos apellidos en todas las menciones: *(Arias & Covinos, 2023)*.
\u2022 **3 o m\xE1s autores:** Desde la **primera menci\xF3n** se escribe solo el primer apellido seguido de *et al.*: *Hern\xE1ndez-Sampieri et al. (2023)*.
\u2022 **Cita directa corta (< 40 palabras):** Entre comillas dentro del p\xE1rrafo indicando n\xFAmero de p\xE1gina \`(p. 45)\`.
\u2022 **Cita en bloque (\u2265 40 palabras):** En p\xE1rrafo aparte con sangr\xEDa izquierda de 1.27 cm y sin comillas.`;
    }
    return domainNotice + `Ruta metodol\xF3gica para **Investigaci\xF3n y Tesis Universitaria**:

1. **Matriz de Consistencia:** El Problema General, Objetivo General e Hip\xF3tesis General deben conservar exactamente las mismas variables, poblaci\xF3n y temporalidad.
2. **Prueba de Normalidad:** Usa *Shapiro-Wilk* para muestras \`n \u2264 50\` o *Kolmogorov-Smirnov* para \`n > 50\`.
3. **Contraste de Hip\xF3tesis:** Si hay normalidad (\`p > 0.05\`), aplica **R de Pearson**; si los datos son ordinales (escala Likert) o no normales, aplica **Rho de Spearman**.`;
  }
  if (effectiveCat === "Negocios y Finanzas") {
    return domainNotice + `An\xE1lisis de Evaluaci\xF3n Financiera (**VAN, TIR y Flujo de Caja**):

\u2022 **Valor Actual Neto (VAN):** Descuenta los flujos futuros al costo de oportunidad (\`COK\` / \`WACC\`) y resta la inversi\xF3n inicial \`I\u2080\`: \`VAN = \u2211 [FC_t / (1 + COK)^t] - I\u2080\`. Si **VAN > 0**, el proyecto genera valor econ\xF3mico.
\u2022 **Tasa Interna de Retorno (TIR):** Tasa que hace \`VAN = 0\`. El proyecto se acepta siempre que **TIR > COK**.
\u2022 **F\xF3rmula en Excel:** \`=VNA(COK; B2:F2) - Inversi\xF3n_Inicial\`.`;
  }
  if (effectiveCat === "Ingenier\xEDa") {
    return domainNotice + `Procedimiento de an\xE1lisis en **Ingenier\xEDa Aplicada**:

1. **Diagrama de Cuerpo Libre (DCL):** A\xEDsla el elemento estructural o volumen de control e identifica reacciones de apoyo y cargas distribuidas.
2. **Ecuaciones Fundamentales:** Aplica equilibrio est\xE1tico (\`\u2211Fx = 0\`, \`\u2211Fy = 0\`, \`\u2211Mz = 0\`) o Primera Ley de la Termodin\xE1mica (\`Q\u0307 - W\u0307 = \u2211\u1E41_s\xB7h_s - \u2211\u1E41_e\xB7h_e\`).
3. **Verificaci\xF3n Dimensional:** Trabaja estrictamente en unidades del Sistema Internacional (\`N, Pa, m, kg, J\`).`;
  }
  if (effectiveCat === "Idiomas") {
    return domainNotice + `Gu\xEDa de **Ingl\xE9s Acad\xE9mico (TOEFL iBT / IELTS Academic)**:

\u2022 **Contraste Gramatical (\`Although\` vs \`Despite\`):**
  - **Although / Even though** + \`Sujeto + Verbo\`: *Although the sample size was small, the results were significant.*
  - **Despite / In spite of** + \`Sustantivo / Verbo en -ing\`: *Despite having a small sample size, the study succeeded.*
\u2022 **Conectores de Alto Puntaje:** *Furthermore, Nevertheless, Consequently, In light of the evidence presented.*`;
  }
  if (/(derivad|derivar|d\/dx|f'\(x\)|tangente)/i.test(s)) {
    const polyMatch = s.match(/(\d*)\s*x\^(\d+)/);
    const polyStep = polyMatch ? `
\u2022 **Aplicado a tu t\xE9rmino \`${polyMatch[0].trim()}\`:** \`d/dx [${polyMatch[0].trim()}] = ${(polyMatch[1] ? parseInt(polyMatch[1], 10) : 1) * parseInt(polyMatch[2], 10)}x^${parseInt(polyMatch[2], 10) - 1}\`.` : "";
    return domainNotice + `En **C\xE1lculo Diferencial**, la derivada representa la pendiente de la recta tangente y la tasa de cambio instant\xE1nea:

\u2022 **Regla de la Potencia:** \`d/dx [x\u207F] = n \xB7 x\u207F\u207B\xB9\`
\u2022 **Regla de la Cadena:** \`d/dx [f(g(x))] = f'(g(x)) \xB7 g'(x)\`
\u2022 **Producto y Cociente:** \`(u\xB7v)' = u'v + u\xB7v'\`  |  \`(u/v)' = (u'v - u\xB7v') / v\xB2\`${polyStep}`;
  }
  if (/(integral|integrar|∫|ilate|por partes|sustituci[oó]n)/i.test(s)) {
    return domainNotice + `En **C\xE1lculo Integral**, selecciona la t\xE9cnica seg\xFAn la estructura del integrando:

1. **Potencia directa:** \`\u222B x\u207F dx = x\u207F\u207A\xB9 / (n + 1) + C\` (\`n \u2260 -1\`).
2. **Sustituci\xF3n simple (\`u\`):** Cuando aparece una funci\xF3n compuesta multiplicada por su derivada interna.
3. **Integraci\xF3n por Partes (\`\u222B u dv = u\xB7v - \u222B v du\`):** Para productos de funciones trascendentes, eligiendo \`u\` seg\xFAn la prioridad **ILATE** (Inversa, Logar\xEDtmica, Algebraica, Trigonom\xE9trica, Exponencial).`;
  }
  return domainNotice + `Desarrollo paso a paso en **${effectiveCat}**:

1. **Planteamiento:** Identificamos las variables de entrada, el dominio de definici\xF3n y las condiciones de contorno de **"${raw}"**.
2. **Propiedad Fundamental:** Aplicamos el teorema o relaci\xF3n anal\xEDtica directa verificando consistencia de signos y unidades.
3. **Comprobaci\xF3n:** Sustituimos la soluci\xF3n obtenida en la expresi\xF3n original para confirmar la identidad.`;
}
function extractBoardNotesFromReply(question, replyText, advisorName, category) {
  const clean = String(replyText || "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const header = `APUNTES DE PIZARRA \u2014 ${advisorName} (${category})
Consulta: ${question}
`;
  const bodyLines = lines.slice(0, 8).map((l) => /^[•\-1-9]/.test(l) ? l : `\u2022 ${l}`);
  return header + bodyLines.join("\n");
}

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "2mb" }));
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim().length < 10) {
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/ai/consult", async (req, res) => {
  const {
    question = "",
    category = "Matem\xE1ticas y Ciencias",
    advisorName = "Dr. Alejandro Vargas",
    contextTitle = "Consulta Acad\xE9mica",
    style = "paso_a_paso",
    tags = []
  } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "La consulta acad\xE9mica no puede estar vac\xEDa." });
    return;
  }
  const detectedDomain = detectAcademicDomain(question);
  const effectiveCategory = detectedDomain || category;
  const domainRedirectNotice = detectedDomain && category && detectedDomain !== category ? `*(Nota: Consultaste a ${advisorName} de ${category}, pero como tu consulta pertenece a **${detectedDomain}**, te respondo con precisi\xF3n de esa especialidad)*:

` : "";
  const ai = getGeminiClient();
  if (ai) {
    try {
      const styleInstruction = style === "sencillo" ? "Explica con analog\xEDas intuitivas y ejemplos cotidianos f\xE1ciles de entender desde cero." : style === "ejercicios" ? "Plantea y resuelve paso a paso 2 ejercicios pr\xE1cticos tipo examen universitario sobre este tema." : style === "formulario" ? "Entrega un resumen ejecutivo con el formulario clave, condiciones de uso y puntos cr\xEDticos." : "Explica el procedimiento paso a paso con rigor universitario, mostrando f\xF3rmulas o c\xF3digo claro.";
      const systemInstruction = `Eres ${advisorName}, un asesor acad\xE9mico universitario experto de la plataforma EduNexus Cloud, especializado estrictamente en ${effectiveCategory}` + (Array.isArray(tags) && tags.length > 0 ? ` (dominas: ${tags.join(", ")})` : "") + `. Contexto actual: ${contextTitle}. ${styleInstruction} Responde siempre en espa\xF1ol de manera clara, directa y estructurada en menos de 220 palabras.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: question.trim(),
        config: {
          systemInstruction
        }
      });
      const text = response.text?.trim();
      if (text) {
        const finalReply = domainRedirectNotice + text;
        const boardNotes2 = extractBoardNotesFromReply(question, finalReply, advisorName, effectiveCategory);
        res.json({
          reply: finalReply,
          boardNotes: boardNotes2,
          effectiveCategory,
          engine: "gemini-3.8-flash"
        });
        return;
      }
    } catch (err) {
      console.warn("Gemini API fallback triggered:", err instanceof Error ? err.message : err);
    }
  }
  const fallbackReply = generateSpecialistAcademicResponse(question, category, advisorName, tags);
  const boardNotes = extractBoardNotesFromReply(question, fallbackReply, advisorName, effectiveCategory);
  res.json({
    reply: fallbackReply,
    boardNotes,
    effectiveCategory,
    engine: "specialist-local"
  });
});
app.post("/api/ai/flashcards", async (req, res) => {
  const { deckKey = "calculo", topic = "" } = req.body || {};
  const ai = getGeminiClient();
  if (ai) {
    try {
      const deckLabel = deckKey === "programacion" ? "Python, SQL y Estructuras de Datos" : deckKey === "ingles" ? "Ingl\xE9s Acad\xE9mico TOEFL / IELTS" : "C\xE1lculo Diferencial, Integral y \xC1lgebra";
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Genera 2 tarjetas de estudio (flashcards) de nivel universitario sobre ${topic || deckLabel}.`,
        config: {
          systemInstruction: "Eres un catedr\xE1tico universitario. Devuelve exactamente 2 flashcards claras y rigurosas en espa\xF1ol.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                front: {
                  type: import_genai.Type.STRING,
                  description: "Pregunta concisa o concepto en el frente de la tarjeta."
                },
                back: {
                  type: import_genai.Type.STRING,
                  description: "Respuesta clara, f\xF3rmula o explicaci\xF3n en el reverso."
                }
              },
              required: ["front", "back"]
            }
          }
        }
      });
      const parsed = JSON.parse((response.text ?? "[]").trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        res.json({ cards: parsed, engine: "gemini-3.8-flash" });
        return;
      }
    } catch (err) {
      console.warn("Gemini flashcards fallback triggered:", err instanceof Error ? err.message : err);
    }
  }
  const fallbackByDeck = {
    calculo: [
      {
        front: "\xBFC\xF3mo se resuelve lim(x\u21920) [\u221A(1+x) - 1] / x?",
        back: "Multiplicando numerador y denominador por la conjugada [\u221A(1+x) + 1], lo que simplifica la x y da 1 / (1 + 1) = 1/2."
      },
      {
        front: "\xBFQu\xE9 indica f''(x\u2080) > 0 cuando f'(x\u2080) = 0?",
        back: "Indica que la funci\xF3n es c\xF3ncava hacia arriba en el punto cr\xEDtico, por lo que x\u2080 es un M\xEDnimo Local."
      }
    ],
    programacion: [
      {
        front: "\xBFPor qu\xE9 buscar una clave en un dict de Python es O(1)?",
        back: "Porque calcula el hash de la clave para acceder directamente a su cubeta en memoria sin recorrer toda la colecci\xF3n."
      },
      {
        front: "\xBFCu\xE1l es el orden l\xF3gico de ejecuci\xF3n de una consulta SQL?",
        back: "FROM / JOIN \u2192 WHERE \u2192 GROUP BY \u2192 HAVING \u2192 SELECT \u2192 ORDER BY \u2192 LIMIT."
      }
    ],
    ingles: [
      {
        front: "\xBFC\xF3mo estructurar un p\xE1rrafo de ensayo en TOEFL/IELTS con PEEL?",
        back: "Point (idea central), Evidence (dato/ejemplo), Explanation (an\xE1lisis) y Link (conexi\xF3n con la tesis)."
      },
      {
        front: 'Diferencia entre "Furthermore" y "Nevertheless"',
        back: '"Furthermore" a\xF1ade argumentos en la misma direcci\xF3n (Adem\xE1s); "Nevertheless" introduce un contraste (No obstante).'
      }
    ]
  };
  res.json({
    cards: fallbackByDeck[deckKey] || fallbackByDeck.calculo,
    engine: "specialist-local"
  });
});
async function startServer() {
  const PORT = Number(process.env.PORT) || 3e3;
  if (process.env.NODE_ENV === "production") {
    const distPath = import_path.default.resolve(__dirname, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduNexus Cloud server running on http://localhost:${PORT}`);
  });
}
startServer();
