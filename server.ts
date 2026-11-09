import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  detectAcademicDomain,
  generateSpecialistAcademicResponse,
  extractBoardNotesFromReply,
} from './src/utils/academicLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/ai/consult — Academic Advisor Consultation (Chat, Course AI, Q&A Forum, Whiteboard Notes)
app.post('/api/ai/consult', async (req, res) => {
  const {
    question = '',
    category = 'Matemáticas y Ciencias',
    advisorName = 'Dr. Alejandro Vargas',
    contextTitle = 'Consulta Académica',
    style = 'paso_a_paso',
    tags = [],
  } = req.body || {};

  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: 'La consulta académica no puede estar vacía.' });
    return;
  }

  const detectedDomain = detectAcademicDomain(question);
  const effectiveCategory = detectedDomain || category;
  const domainRedirectNotice =
    detectedDomain && category && detectedDomain !== category
      ? `*(Nota: Consultaste a ${advisorName} de ${category}, pero como tu consulta pertenece a **${detectedDomain}**, te respondo con precisión de esa especialidad)*:\n\n`
      : '';

  const ai = getGeminiClient();
  if (ai) {
    try {
      const styleInstruction =
        style === 'sencillo'
          ? 'Explica con analogías intuitivas y ejemplos cotidianos fáciles de entender desde cero.'
          : style === 'ejercicios'
          ? 'Plantea y resuelve paso a paso 2 ejercicios prácticos tipo examen universitario sobre este tema.'
          : style === 'formulario'
          ? 'Entrega un resumen ejecutivo con el formulario clave, condiciones de uso y puntos críticos.'
          : 'Explica el procedimiento paso a paso con rigor universitario, mostrando fórmulas o código claro.';

      const systemInstruction =
        `Eres ${advisorName}, un asesor académico universitario experto de la plataforma EduNexus Cloud, especializado estrictamente en ${effectiveCategory}` +
        (Array.isArray(tags) && tags.length > 0 ? ` (dominas: ${tags.join(', ')})` : '') +
        `. Contexto actual: ${contextTitle}. ${styleInstruction} ` +
        `Responde siempre en español de manera clara, directa y estructurada en menos de 220 palabras.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: question.trim(),
        config: {
          systemInstruction,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const finalReply = domainRedirectNotice + text;
        const boardNotes = extractBoardNotesFromReply(question, finalReply, advisorName, effectiveCategory);
        res.json({
          reply: finalReply,
          boardNotes,
          effectiveCategory,
          engine: 'gemini-3.8-flash',
        });
        return;
      }
    } catch (err) {
      console.warn('Gemini API fallback triggered:', err instanceof Error ? err.message : err);
    }
  }

  // Deterministic specialist fallback when API key is not configured in test environment
  const fallbackReply = generateSpecialistAcademicResponse(question, category, advisorName, tags);
  const boardNotes = extractBoardNotesFromReply(question, fallbackReply, advisorName, effectiveCategory);
  res.json({
    reply: fallbackReply,
    boardNotes,
    effectiveCategory,
    engine: 'specialist-local',
  });
});

// POST /api/ai/flashcards — Generates 2 new flashcards for a given deck
app.post('/api/ai/flashcards', async (req, res) => {
  const { deckKey = 'calculo', topic = '' } = req.body || {};
  const ai = getGeminiClient();

  if (ai) {
    try {
      const deckLabel =
        deckKey === 'programacion'
          ? 'Python, SQL y Estructuras de Datos'
          : deckKey === 'ingles'
          ? 'Inglés Académico TOEFL / IELTS'
          : 'Cálculo Diferencial, Integral y Álgebra';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Genera 2 tarjetas de estudio (flashcards) de nivel universitario sobre ${topic || deckLabel}.`,
        config: {
          systemInstruction:
            'Eres un catedrático universitario. Devuelve exactamente 2 flashcards claras y rigurosas en español.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: {
                  type: Type.STRING,
                  description: 'Pregunta concisa o concepto en el frente de la tarjeta.',
                },
                back: {
                  type: Type.STRING,
                  description: 'Respuesta clara, fórmula o explicación en el reverso.',
                },
              },
              required: ['front', 'back'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        res.json({ cards: parsed, engine: 'gemini-3.8-flash' });
        return;
      }
    } catch (err) {
      console.warn('Gemini flashcards fallback triggered:', err instanceof Error ? err.message : err);
    }
  }

  // Deterministic fallback cards
  const fallbackByDeck: Record<string, Array<{ front: string; back: string }>> = {
    calculo: [
      {
        front: '¿Cómo se resuelve lim(x→0) [√(1+x) - 1] / x?',
        back: 'Multiplicando numerador y denominador por la conjugada [√(1+x) + 1], lo que simplifica la x y da 1 / (1 + 1) = 1/2.',
      },
      {
        front: '¿Qué indica f\'\'(x₀) > 0 cuando f\'(x₀) = 0?',
        back: 'Indica que la función es cóncava hacia arriba en el punto crítico, por lo que x₀ es un Mínimo Local.',
      },
    ],
    programacion: [
      {
        front: '¿Por qué buscar una clave en un dict de Python es O(1)?',
        back: 'Porque calcula el hash de la clave para acceder directamente a su cubeta en memoria sin recorrer toda la colección.',
      },
      {
        front: '¿Cuál es el orden lógico de ejecución de una consulta SQL?',
        back: 'FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.',
      },
    ],
    ingles: [
      {
        front: '¿Cómo estructurar un párrafo de ensayo en TOEFL/IELTS con PEEL?',
        back: 'Point (idea central), Evidence (dato/ejemplo), Explanation (análisis) y Link (conexión con la tesis).',
      },
      {
        front: 'Diferencia entre "Furthermore" y "Nevertheless"',
        back: '"Furthermore" añade argumentos en la misma dirección (Además); "Nevertheless" introduce un contraste (No obstante).',
      },
    ],
  };

  res.json({
    cards: fallbackByDeck[deckKey] || fallbackByDeck.calculo,
    engine: 'specialist-local',
  });
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduNexus Cloud server running on http://localhost:${PORT}`);
  });
}

startServer();
