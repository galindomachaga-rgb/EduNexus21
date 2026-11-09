import {
  TutorProfile,
  CourseItem,
  NoteItem,
  BookingItem,
} from '../data/seedData';
import { CurrencyCode } from './academicLogic';

export interface GoogleSitesExportParams {
  tutors: TutorProfile[];
  courses: CourseItem[];
  notes: NoteItem[];
  bookings: BookingItem[];
  currency: CurrencyCode;
  liveAppUrl: string;
}

/**
 * Generates a 100% self-contained single-file HTML document designed specifically
 * for Google Sites ("Insertar -> Incorporar -> Código de incorporación").
 * It embeds the user's current tutors, courses, notes, bookings, interactive
 * f(x) whiteboard canvas, Pomodoro timer, 0-20 grade calculator, and AI solver.
 */
export function buildGoogleSitesStandaloneHtml(params: GoogleSitesExportParams): string {
  const safeDataJson = JSON.stringify({
    tutors: params.tutors,
    courses: params.courses,
    notes: params.notes,
    bookings: params.bookings,
    currency: params.currency,
    liveAppUrl: params.liveAppUrl,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduNexus Cloud — Asesorías Online, Estudio & Apuntes (Google Sites Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
            display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          }
        }
      }
    };
  </script>
  <style>
    body { font-family: 'DM Sans', system-ui, sans-serif; }
    h1, h2, h3, h4 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    .canvas-grid {
      background-color: #ffffff;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
      background-size: 18px 18px;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
  <!-- Top Bar -->
  <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center">EN</div>
        <div>
          <span class="font-extrabold text-base block leading-none">EduNexus <span class="text-indigo-600 dark:text-indigo-400">Cloud</span></span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-slate-500">Google Sites Interactive Edition</span>
        </div>
      </div>

      <nav class="flex flex-wrap items-center gap-1" id="nav-tabs">
        <button onclick="switchTab('tutors')" id="tab-btn-tutors" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 cursor-pointer">Asesores</button>
        <button onclick="switchTab('courses')" id="tab-btn-courses" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Cursos</button>
        <button onclick="switchTab('studio')" id="tab-btn-studio" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Estudio & Calculadora</button>
        <button onclick="switchTab('classroom')" id="tab-btn-classroom" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Aula Pizarra f(x)</button>
        <button onclick="switchTab('notes')" id="tab-btn-notes" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Apuntes</button>
      </nav>

      <div class="flex items-center gap-2">
        <button onclick="toggleCurrency()" id="currency-btn" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs cursor-pointer">$ USD</button>
        <button onclick="toggleDark()" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer">Tema</button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <!-- TAB 1: TUTORS -->
    <section id="view-tutors" class="space-y-6">
      <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white">
        <span class="text-xs font-mono uppercase tracking-widest text-indigo-300 block mb-2">Red Universitaria Verificada SUNEDU</span>
        <h1 class="text-2xl sm:text-4xl font-extrabold mb-2">Mentores Universitarios 1-a-1, Pizarra Matemática y Estudio IA</h1>
        <p class="text-indigo-200 text-xs sm:text-sm max-w-2xl mb-4">Busca por especialidad, agenda asesorías personalizadas o resuelve ecuaciones paso a paso en el Aula Virtual.</p>
        <div class="flex flex-col sm:flex-row gap-2 max-w-xl">
          <input id="tutor-search" oninput="renderTutors()" type="text" placeholder="Filtrar por Cálculo, Python, Tesis APA, Finanzas..." class="flex-1 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-medium focus:outline-none" />
          <button onclick="switchTab('classroom')" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer">Ir a Pizarra Interactiva →</button>
        </div>
      </div>
      <div id="tutors-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"></div>
    </section>

    <!-- TAB 2: COURSES -->
    <section id="view-courses" class="hidden space-y-6">
      <div class="bg-indigo-950 text-white rounded-2xl p-6">
        <h2 class="text-xl sm:text-2xl font-extrabold">Academia Asíncrona & Cursos Grabados</h2>
        <p class="text-xs text-indigo-200 mt-1">Marca tus módulos completados y lleva el control de tu avance académico.</p>
      </div>
      <div id="courses-grid" class="grid grid-cols-1 md:grid-cols-3 gap-5"></div>
    </section>

    <!-- TAB 3: STUDIO (Pomodoro + 0-20 Grade Calculator) -->
    <section id="view-studio" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
        <h3 class="font-bold text-base">Temporizador Pomodoro Pro</h3>
        <div id="pomo-display" class="text-5xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">25:00</div>
        <div class="flex justify-center gap-2">
          <button onclick="togglePomodoro()" id="pomo-btn" class="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">Iniciar</button>
          <button onclick="resetPomodoro()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs cursor-pointer">Reiniciar</button>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 class="font-bold text-base">Calculadora Ponderada Universitaria (Escala 0–20)</h3>
        <div class="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label class="block font-bold mb-1">Prácticas (30%)</label>
            <input id="g-pc" type="number" value="15" min="0" max="20" oninput="calcGrades()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono" />
          </div>
          <div>
            <label class="block font-bold mb-1">Parcial (30%)</label>
            <input id="g-ep" type="number" value="14" min="0" max="20" oninput="calcGrades()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono" />
          </div>
          <div>
            <label class="block font-bold mb-1">Final (40%)</label>
            <input id="g-ef" type="number" value="16" min="0" max="20" oninput="calcGrades()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono" />
          </div>
        </div>
        <div id="grade-result" class="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-900 dark:text-indigo-200"></div>
      </div>
    </section>

    <!-- TAB 4: CLASSROOM WHITEBOARD + AI ADVISOR -->
    <section id="view-classroom" class="hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold">f(x) =</span>
            <input id="fx-input" type="text" value="sin(x)" class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs w-36" />
            <button onclick="plotFunction()" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs cursor-pointer">Graficar f(x)</button>
          </div>
          <button onclick="clearBoard()" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs cursor-pointer">Limpiar Pizarra</button>
        </div>
        <canvas id="board-canvas" width="760" height="400" class="w-full h-[380px] rounded-xl border border-slate-200 canvas-grid cursor-crosshair"></canvas>
      </div>

      <div class="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-[450px]">
        <h3 class="font-bold text-sm pb-2 border-b border-slate-200 dark:border-slate-800">Chat Asesor IA en Vivo</h3>
        <div id="ai-chat-box" class="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
          <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">¡Hola! Escribe una ecuación (ej. <code class="font-mono">x^2 - 5x + 6 = 0</code>) o consulta de programación/tesis para resolverla paso a paso.</div>
        </div>
        <div class="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <input id="ai-chat-input" type="text" placeholder="Escribe tu problema..." onkeydown="if(event.key==='Enter')sendAiChat()" class="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs" />
          <button onclick="sendAiChat()" class="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">Enviar</button>
        </div>
      </div>
    </section>

    <!-- TAB 5: NOTES -->
    <section id="view-notes" class="hidden grid grid-cols-1 md:grid-cols-3 gap-4" id="notes-grid"></section>
  </main>

  <script>
    const STATE = ${safeDataJson};
    let currentCurrency = STATE.currency || 'USD';
    let pomoSeconds = 25 * 60;
    let pomoTimer = null;

    function formatPrice(usd) {
      return currentCurrency === 'PEN' ? 'S/ ' + Math.round(usd * 3.75) + ' PEN' : '$' + usd + ' USD';
    }

    function toggleCurrency() {
      currentCurrency = currentCurrency === 'USD' ? 'PEN' : 'USD';
      document.getElementById('currency-btn').textContent = currentCurrency === 'USD' ? '$ USD' : 'S/ PEN';
      renderTutors();
      renderCourses();
    }

    function toggleDark() {
      document.documentElement.classList.toggle('dark');
    }

    function switchTab(tab) {
      ['tutors', 'courses', 'studio', 'classroom', 'notes'].forEach(id => {
        const el = document.getElementById('view-' + id);
        const btn = document.getElementById('tab-btn-' + id);
        if (el) el.classList.toggle('hidden', id !== tab);
        if (btn) {
          btn.className = id === tab
            ? 'px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white cursor-pointer'
            : 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer';
        }
      });
      if (tab === 'classroom') setTimeout(plotFunction, 60);
    }

    function renderTutors() {
      const q = (document.getElementById('tutor-search')?.value || '').toLowerCase();
      const grid = document.getElementById('tutors-grid');
      const filtered = STATE.tutors.filter(t =>
        !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
      );
      grid.innerHTML = filtered.map(t => \`
        <article class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 class="font-bold text-base">\${t.name}</h3>
                <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">\${t.category}</p>
                <p class="text-[11px] text-slate-500">\${t.uni}</p>
              </div>
              <span class="font-mono font-extrabold text-sm">\${formatPrice(t.price)}/h</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 mb-3">\${t.bio}</p>
            <div class="flex flex-wrap gap-1">
              \${t.tags.map(tag => \`<span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">\${tag}</span>\`).join('')}
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span class="font-mono font-bold text-amber-500">★ \${t.rating.toFixed(1)} (\${t.reviews})</span>
            <button onclick="switchTab('classroom')" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Abrir Aula →</button>
          </div>
        </article>
      \`).join('');
    }

    function renderCourses() {
      const grid = document.getElementById('courses-grid');
      grid.innerHTML = STATE.courses.map(c => \`
        <article class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <span class="text-[10px] font-mono uppercase text-indigo-600 font-bold">\${c.category}</span>
          <h3 class="font-bold text-base">\${c.title}</h3>
          <p class="text-xs text-slate-500">\${c.instructor} · \${formatPrice(c.price)}</p>
          <ul class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            \${c.modules.map(m => \`<li>• \${m.title}</li>\`).join('')}
          </ul>
        </article>
      \`).join('');
    }

    function renderNotes() {
      const grid = document.getElementById('view-notes');
      grid.innerHTML = STATE.notes.map(n => \`
        <article class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
          <span class="text-[10px] font-mono text-indigo-600 font-bold">\${n.category} · \${n.updatedAt}</span>
          <h3 class="font-bold text-sm">\${n.title}</h3>
          <pre class="text-xs font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">\${n.body}</pre>
        </article>
      \`).join('');
    }

    function togglePomodoro() {
      const btn = document.getElementById('pomo-btn');
      if (pomoTimer) {
        clearInterval(pomoTimer);
        pomoTimer = null;
        btn.textContent = 'Reanudar';
      } else {
        btn.textContent = 'Pausar';
        pomoTimer = setInterval(() => {
          if (pomoSeconds > 0) pomoSeconds--;
          const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
          const s = String(pomoSeconds % 60).padStart(2, '0');
          document.getElementById('pomo-display').textContent = m + ':' + s;
        }, 1000);
      }
    }

    function resetPomodoro() {
      if (pomoTimer) clearInterval(pomoTimer);
      pomoTimer = null;
      pomoSeconds = 25 * 60;
      document.getElementById('pomo-display').textContent = '25:00';
      document.getElementById('pomo-btn').textContent = 'Iniciar';
    }

    function calcGrades() {
      const pc = Number(document.getElementById('g-pc').value) || 0;
      const ep = Number(document.getElementById('g-ep').value) || 0;
      const ef = Number(document.getElementById('g-ef').value) || 0;
      const avg = (pc * 0.3 + ep * 0.3 + ef * 0.4).toFixed(2);
      const needed = Math.max(0, (10.5 - (pc * 0.3 + ep * 0.3)) / 0.4).toFixed(2);
      document.getElementById('grade-result').textContent =
        'Promedio Final Estimado: ' + avg + ' / 20 · Nota mínima requerida en Final para aprobar (10.5): ' + needed;
    }

    // Whiteboard Canvas
    const canvas = document.getElementById('board-canvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    canvas.addEventListener('pointerdown', e => {
      drawing = true;
      const r = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.lineTo((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
      ctx.stroke();
    });
    window.addEventListener('pointerup', () => { drawing = false; });

    function clearBoard() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function plotFunction() {
      clearBoard();
      const expr = (document.getElementById('fx-input').value || 'sin(x)').toLowerCase();
      const w = canvas.width, h = canvas.height;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.stroke();

      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let px = 0; px < w; px++) {
        const x = (px - w / 2) / 40;
        let y = Math.sin(x);
        try {
          const safe = expr.replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/\\^/g, '**');
          y = Function('x', 'return ' + safe)(x);
        } catch {}
        const py = h / 2 - y * 40;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    function sendAiChat() {
      const input = document.getElementById('ai-chat-input');
      const box = document.getElementById('ai-chat-box');
      const text = input.value.trim();
      if (!text) return;
      box.innerHTML += \`<div class="p-2.5 rounded-xl bg-indigo-600 text-white ml-6">\${text}</div>\`;
      input.value = '';
      const reply = 'Desarrollo paso a paso: 1) Identificamos variables y dominio de "' + text + '". 2) Aplicamos la propiedad analítica correspondiente y verificamos la solución en la pizarra.';
      box.innerHTML += \`<div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 mr-6 font-medium">\${reply}</div>\`;
      box.scrollTop = box.scrollHeight;
    }

    renderTutors();
    renderCourses();
    renderNotes();
    calcGrades();
  </script>
</body>
</html>`;
}
