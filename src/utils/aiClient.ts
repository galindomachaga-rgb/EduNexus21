import {
  extractBoardNotesFromReply,
  generateSpecialistAcademicResponse,
} from './academicLogic';
import { FlashcardItem } from '../data/seedData';

export interface ConsultAiResponse {
  reply: string;
  boardNotes: string;
  effectiveCategory: string;
  engine: string;
}

/**
 * Calls the server-side Gemini endpoint (/api/ai/consult) and falls back cleanly
 * to the deterministic specialist solver if the network request fails.
 */
export async function consultAcademicAdvisor(params: {
  question: string;
  category: string;
  advisorName: string;
  contextTitle?: string;
  style?: string;
  tags?: string[];
}): Promise<ConsultAiResponse> {
  try {
    const response = await fetch('/api/ai/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        return data as ConsultAiResponse;
      }
    }
  } catch {
    // Fallback below
  }

  const reply = generateSpecialistAcademicResponse(
    params.question,
    params.category,
    params.advisorName,
    params.tags || []
  );
  const boardNotes = extractBoardNotesFromReply(
    params.question,
    reply,
    params.advisorName,
    params.category
  );
  return {
    reply,
    boardNotes,
    effectiveCategory: params.category,
    engine: 'specialist-local',
  };
}

/**
 * Calls the server-side Gemini endpoint (/api/ai/flashcards) to generate 2 new flashcards.
 */
export async function generateAiFlashcards(deckKey: string, topic?: string): Promise<FlashcardItem[]> {
  try {
    const response = await fetch('/api/ai/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckKey, topic }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.cards) && data.cards.length > 0) {
        return data.cards;
      }
    }
  } catch {
    // Fallback below
  }

  if (deckKey === 'programacion') {
    return [
      {
        front: '¿Por qué buscar una clave en un dict de Python es O(1)?',
        back: 'Porque calcula el hash de la clave para acceder directamente a su posición en memoria sin recorrer toda la colección.',
      },
      {
        front: '¿Cuál es el orden lógico de ejecución de una consulta SQL?',
        back: 'FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.',
      },
    ];
  }
  if (deckKey === 'ingles') {
    return [
      {
        front: '¿Cómo estructurar un párrafo de ensayo en TOEFL/IELTS con PEEL?',
        back: 'Point (idea principal), Evidence (dato/ejemplo), Explanation (análisis) y Link (conexión con la tesis).',
      },
      {
        front: 'Diferencia entre "Furthermore" y "Nevertheless"',
        back: '"Furthermore" agrega argumentos en la misma línea (Además); "Nevertheless" introduce un contraste (No obstante).',
      },
    ];
  }
  return [
    {
      front: '¿Cómo se resuelve lim(x→0) [√(1+x) - 1] / x?',
      back: 'Multiplicando numerador y denominador por la conjugada [√(1+x) + 1], lo que simplifica la x y da 1 / (1 + 1) = 1/2.',
    },
    {
      front: "¿Qué indica f''(x₀) > 0 cuando f'(x₀) = 0?",
      back: 'Indica que la curva es cóncava hacia arriba en ese punto crítico, por lo que x₀ es un Mínimo Local.',
    },
  ];
}

/**
 * Generates and downloads a standalone offline HTML package for a class or course module.
 */
export function downloadOfflineClassPackage(
  title: string,
  instructor: string,
  category: string,
  extraDetails: string,
  studentName: string = 'Estudiante EduNexus'
): void {
  const htmlPack = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Clase Descargada: ${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; max-width: 820px; margin: 0 auto; line-height: 1.6; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; margin-bottom: 20px; }
    .kicker { font-size: 12px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 10px; white-space: pre-wrap; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="kicker">EduNexus Cloud · Paquete Académico Offline</div>
    <h1>${title}</h1>
    <p><strong>Docente / Asesor:</strong> ${instructor} &nbsp;·&nbsp; <strong>Especialidad:</strong> ${category}</p>
    <p><strong>Estudiante:</strong> ${studentName} &nbsp;·&nbsp; <strong>Fecha de exportación:</strong> ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="card">
    <h2>Contenido Grabado, Apuntes de Clase y Guía Práctica</h2>
    <pre>${extraDetails}

• Síntesis Metodológica:
  1. Conceptos fundamentales y demostraciones desarrolladas en pizarra digital.
  2. Resolución paso a paso de problemas tipo examen universitario.
  3. Recomendaciones clave para evaluación parcial y final.</pre>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlPack], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clase_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 38)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
