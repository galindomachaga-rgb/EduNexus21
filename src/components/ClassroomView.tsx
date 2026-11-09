import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Download,
  Camera,
  BookmarkPlus,
  Eraser,
  Trash2,
  Sparkles,
  Send,
  LineChart,
} from 'lucide-react';
import { TutorProfile } from '../data/seedData';
import {
  AcademicCategory,
  evaluateMathFunctionAtX,
  extractBoardNotesFromReply,
  generateSpecialistAcademicResponse,
} from '../utils/academicLogic';
import { consultAcademicAdvisor, downloadOfflineClassPackage } from '../utils/aiClient';
import { FormattedMessage } from './FormattedMessage';

interface ClassroomViewProps {
  tutors: TutorProfile[];
  activeTutor: TutorProfile;
  onSelectTutor: (tutor: TutorProfile) => void;
  currentUserName: string;
  onSaveBoardNote: (title: string, category: AcademicCategory, body: string) => void;
  externalBoardState: { question: string; notes: string } | null;
  onNotify: (msg: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isTutor: boolean;
  isTyping?: boolean;
}

const BOARD_COLORS = [
  { hex: '#1e1b4b', label: 'Índigo Oscuro' },
  { hex: '#4f46e5', label: 'Índigo' },
  { hex: '#e11d48', label: 'Carmesí' },
  { hex: '#059669', label: 'Esmeralda' },
  { hex: '#d97706', label: 'Ámbar' },
];

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  tutors,
  activeTutor,
  onSelectTutor,
  currentUserName,
  onSaveBoardNote,
  externalBoardState,
  onNotify,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);

  const [brushColor, setBrushColor] = useState('#1e1b4b');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [customFuncExpr, setCustomFuncExpr] = useState('sin(x)');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(862);
  const [boardQuestion, setBoardQuestion] = useState('Derivadas, Integrales y Ecuaciones');
  const [boardNotesText, setBoardNotesText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs < 10 ? '0' + hrs : hrs}:${mins < 10 ? '0' + mins : mins}:${s < 10 ? '0' + s : s}`;
  };

  // Draw AI structured notes & visual diagram onto the HTML5 Canvas
  const drawAiNotesOnCanvas = useCallback(
    (tutor: TutorProfile, questionText: string, replyText: string) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas) return;
      if (container && container.clientWidth > 0) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width || 720;
      const h = canvas.height || 420;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Header bar on board
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, 44);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`APUNTES EN PIZARRA DEL ASESOR IA · ${tutor.category.toUpperCase()}`, 16, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${tutor.name}  —  Tema: "${questionText.slice(0, 52)}"`, 16, 35);

      const leftW = Math.floor(w * 0.61);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftW + 10, 52);
      ctx.lineTo(leftW + 10, h - 16);
      ctx.stroke();

      const cleanLines = replyText
        .replace(/```[a-z]*/gi, '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      let yPos = 66;
      const maxCharsPerLine = Math.max(36, Math.floor(leftW / 7.2));

      for (let i = 0; i < cleanLines.length; i++) {
        if (yPos > h - 22) break;
        let line = cleanLines[i];
        const isHeaderLine = /^[•1-9]|^APUNTES|^Consulta/.test(line);
        ctx.fillStyle = isHeaderLine ? '#0f172a' : '#334155';
        ctx.font = `${isHeaderLine ? '600 ' : '400 '}12px "DM Sans", sans-serif`;

        while (line.length > 0 && yPos <= h - 22) {
          let chunk = line.slice(0, maxCharsPerLine);
          if (line.length > maxCharsPerLine) {
            const lastSpace = chunk.lastIndexOf(' ');
            if (lastSpace > 20) chunk = line.slice(0, lastSpace);
          }
          ctx.fillText(chunk, 16, yPos);
          line = line.slice(chunk.length).trim();
          yPos += 17;
        }
        yPos += 4;
      }

      // Right column visual schema / curve
      const rx = leftW + 22;
      const rw = w - rx - 16;
      const ry = 56;
      const rh = h - 74;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);

      ctx.fillStyle = '#334155';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('ESQUEMA / GRÁFICA ANALÍTICA', rx + 12, ry + 20);

      const cx = rx + rw / 2;
      const cy = ry + rh / 2 + 10;

      if (tutor.category === 'Matemáticas y Ciencias' || tutor.category === 'Ingeniería') {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx + 14, cy);
        ctx.lineTo(rx + rw - 14, cy);
        ctx.moveTo(cx, ry + 34);
        ctx.lineTo(cx, ry + rh - 16);
        ctx.stroke();

        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const isQuad = /x\^2|cuadr[aá]tic|par[aá]bola|derivad|integral/i.test(questionText);
        for (let px = rx + 18; px < rx + rw - 18; px++) {
          const nx = (px - cx) / 28;
          const ny = isQuad ? nx * nx - 1.5 : Math.sin(nx);
          const py = cy - ny * 26;
          if (py > ry + 32 && py < ry + rh - 14) {
            if (px === rx + 18) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(
          isQuad ? 'Curva: f(x) = ax² + bx + c' : 'Modelo: f(x) = A·sen(x)',
          rx + 14,
          ry + rh - 12
        );
      } else {
        const boxes = [
          '1. Planteamiento / Datos',
          `2. Regla de ${tutor.category.split(' ')[0]}`,
          '3. Resultado Verificado',
        ];
        boxes.forEach((label, bIdx) => {
          const by = ry + 42 + bIdx * 78;
          ctx.fillStyle = bIdx === 2 ? '#ecfdf5' : '#eef2ff';
          ctx.fillRect(rx + 14, by, rw - 28, 46);
          ctx.strokeStyle = bIdx === 2 ? '#10b981' : '#6366f1';
          ctx.strokeRect(rx + 14, by, rw - 28, 46);
          ctx.fillStyle = '#0f172a';
          ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(label.slice(0, 26), rx + 22, by + 27);
          if (bIdx < 2) {
            ctx.strokeStyle = '#6366f1';
            ctx.beginPath();
            ctx.moveTo(cx, by + 46);
            ctx.lineTo(cx, by + 78);
            ctx.stroke();
          }
        });
      }
    },
    []
  );

  // Plot mathematical function f(x) on the whiteboard
  const plotFunctionOnCanvas = useCallback((exprRaw: string, customTitle?: string) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    if (container && container.clientWidth > 0) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width || 680;
    const h = canvas.height || 400;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Coordinate axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, h / 2);
    ctx.lineTo(w - 30, h / 2);
    ctx.moveTo(w / 2, 25);
    ctx.lineTo(w / 2, h - 25);
    ctx.stroke();

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    const scaleX = 40;
    const scaleY = 40;
    for (let px = 35; px < w - 35; px++) {
      const xVal = (px - w / 2) / scaleX;
      const yVal = evaluateMathFunctionAtX(exprRaw, xVal);
      if (Number.isFinite(yVal)) {
        const py = h / 2 - yVal * scaleY;
        if (py >= 15 && py <= h - 15) {
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          started = false;
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(customTitle || `Gráfica de f(x) = ${exprRaw}`, 45, 38);
  }, []);

  // Re-initialize chat and whiteboard when activeTutor changes
  useEffect(() => {
    const initialTopic = activeTutor.tags[0] || activeTutor.category;
    const initialReply = generateSpecialistAcademicResponse(
      initialTopic,
      activeTutor.category,
      activeTutor.name,
      activeTutor.tags
    );
    const cleanNotes = extractBoardNotesFromReply(
      initialTopic,
      initialReply,
      activeTutor.name,
      activeTutor.category
    );
    setBoardQuestion(initialTopic);
    setBoardNotesText(cleanNotes);
    setChatMessages([
      {
        id: 'welcome-' + activeTutor.id,
        sender: `${activeTutor.name} · Asesor IA (${activeTutor.category})`,
        text: `¡Hola! Soy **${activeTutor.name}** (${activeTutor.uni}). Escríbeme cualquier problema matemático, consulta de código o duda metodológica en el chat; te responderé al instante y actualizaré la Pizarra Digital con el desarrollo paso a paso.`,
        isTutor: true,
      },
    ]);

    const t = setTimeout(() => {
      drawAiNotesOnCanvas(activeTutor, initialTopic, cleanNotes);
    }, 50);
    return () => clearTimeout(t);
  }, [activeTutor, drawAiNotesOnCanvas]);

  // Apply external board updates from the Gemini Specialist modal
  useEffect(() => {
    if (externalBoardState && externalBoardState.notes) {
      setBoardQuestion(externalBoardState.question);
      setBoardNotesText(externalBoardState.notes);
      drawAiNotesOnCanvas(activeTutor, externalBoardState.question, externalBoardState.notes);
    }
  }, [externalBoardState, activeTutor, drawAiNotesOnCanvas]);

  // Pointer drawing handlers
  const getPointerPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPointerPos(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    isDrawingRef.current = false;
  };

  const handleClearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onNotify('Pizarra limpia y lista para nuevos trazos');
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width || 800;
      exportCanvas.height = canvas.height || 440;
      const eCtx = exportCanvas.getContext('2d');
      if (eCtx) {
        eCtx.fillStyle = '#ffffff';
        eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        eCtx.drawImage(canvas, 0, 0);
      }
      const dataUrl = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pizarra_edunexus_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onNotify('Imagen de la pizarra exportada en formato .PNG');
    } catch {
      onNotify('Pizarra lista para exportar');
    }
  };

  const handleDownloadClassRecording = () => {
    const transcript = chatMessages.map((m) => `${m.sender}: ${m.text}`).join('\n\n');
    downloadOfflineClassPackage(
      `Sesión de Aula Virtual con ${activeTutor.name}`,
      activeTutor.name,
      activeTutor.category,
      `Apuntes en Pizarra:\n${boardNotesText}\n\nTranscripción de la Sesión:\n${transcript}`,
      currentUserName
    );
    onNotify('Paquete de clase descargado en formato .HTML offline');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: currentUserName,
      text: msg,
      isTutor: false,
    };
    const typingMsg: ChatMessage = {
      id: 'typing-' + Date.now(),
      sender: activeTutor.name,
      text: '',
      isTutor: true,
      isTyping: true,
    };

    setChatMessages((prev) => [...prev, userMsg, typingMsg]);

    const res = await consultAcademicAdvisor({
      question: msg,
      category: activeTutor.category,
      advisorName: activeTutor.name,
      contextTitle: 'Aula Virtual en Vivo',
      style: 'paso_a_paso',
      tags: activeTutor.tags,
    });

    setChatMessages((prev) =>
      prev
        .filter((m) => !m.isTyping)
        .concat({
          id: 'ai-' + Date.now(),
          sender: `${activeTutor.name} · Asesor IA (${res.effectiveCategory})`,
          text: res.reply,
          isTutor: true,
        })
    );

    setBoardQuestion(msg);
    setBoardNotesText(res.boardNotes);
    drawAiNotesOnCanvas(activeTutor, msg, res.boardNotes);
  };

  return (
    <section aria-label="Aula Virtual y Pizarra Compartida" className="space-y-5">
      {/* Top Classroom Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Sala de Estudio Interactiva · Audio y Pizarra Sincronizados
          </p>
          <h2 className="text-base sm:text-lg font-bold tracking-tight mt-0.5">
            Asesor conectado: {activeTutor.name} ({activeTutor.category})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMicOn((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              micOn
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}
          >
            {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{micOn ? 'Micrófono: Activo' : 'Micrófono: Silenciado'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCamOn((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              camOn
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}
          >
            {camOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{camOn ? 'Cámara: Activa' : 'Cámara: Apagada'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadClassRecording}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Clase</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Exportar PNG</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onSaveBoardNote(
                `Pizarra IA (${activeTutor.name}): ${boardQuestion.slice(0, 42)}`,
                activeTutor.category,
                `# Apuntes Oficiales de Pizarra Digital — ${activeTutor.name} (${activeTutor.category})\n\n${boardNotesText}`
              )
            }
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Guardar en Apuntes</span>
          </button>
        </div>
      </div>

      {/* Main Split: Whiteboard (8 cols) + Live Video & Chat (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Interactive Whiteboard */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Trazo:</span>
              {BOARD_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  aria-label={`Color ${c.label}`}
                  onClick={() => {
                    setIsEraser(false);
                    setBrushColor(c.hex);
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full transition ${
                    !isEraser && brushColor === c.hex
                      ? 'ring-2 ring-offset-2 ring-indigo-600 dark:ring-offset-slate-900'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span>Grosor: {brushSize}px</span>
                <input
                  type="range"
                  min={2}
                  max={14}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  aria-label="Grosor del pincel"
                  className="w-16 accent-indigo-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  f(x)=
                </span>
                <input
                  type="text"
                  value={customFuncExpr}
                  onChange={(e) => setCustomFuncExpr(e.target.value)}
                  aria-label="Expresión de función matemática f(x)"
                  placeholder="x^2/4 - 2"
                  className="w-24 text-xs font-mono bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    plotFunctionOnCanvas(
                      customFuncExpr,
                      `f(x) = ${customFuncExpr}  |  Graficador Analítico`
                    );
                    onNotify(`Función f(x) = ${customFuncExpr} graficada en la pizarra`);
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium whitespace-nowrap shrink-0"
                >
                  Graficar
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const samples = ['sin(x)', 'x^2 / 4 - 2', 'cos(x) * sin(x)', '2*x - 1'];
                  const pick = samples[Math.floor(Math.random() * samples.length)];
                  setCustomFuncExpr(pick);
                  plotFunctionOnCanvas(pick, `f(x) = ${pick}  |   Curva Ejemplo`);
                  onNotify(`Función ejemplo f(x) = ${pick} graficada`);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Curva Ejemplo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEraser(true);
                  onNotify('Borrador activado en la pizarra');
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  isEraser
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Borrador</span>
              </button>

              <button
                type="button"
                onClick={handleClearBoard}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Canvas Stage */}
          <div
            ref={containerRef}
            className="relative w-full h-[380px] sm:h-[430px] canvas-grid bg-white cursor-crosshair"
          >
            <canvas
              ref={canvasRef}
              data-testid="whiteboard-canvas"
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleStopDraw}
              onMouseLeave={handleStopDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleStopDraw}
              className="w-full h-full block touch-none"
            />
          </div>

          {/* Live AI Structured Notes Panel below Canvas */}
          <div className="p-4 bg-slate-900 text-slate-100 border-t border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">Apuntes del Asesor IA en Pizarra</span>
                <span className="mx-2 text-slate-500">·</span>
                <span>Tema: {boardQuestion}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  drawAiNotesOnCanvas(activeTutor, boardQuestion, boardNotesText);
                  onNotify('Apuntes del Asesor IA redibujados en la pizarra');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Redibujar Apunte IA en Pizarra</span>
              </button>
            </div>
            <pre className="text-xs text-slate-200 bg-slate-950/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-mono max-h-36 overflow-y-auto leading-relaxed">
              {boardNotesText}
            </pre>
          </div>
        </div>

        {/* Right: Tutor Feed & Live Chat */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Active Advisor Card */}
          <div className="bg-slate-900 rounded-xl p-4 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Transmisión HD · Sincronización IA</span>
              <span className="font-mono tabular-nums text-slate-200">{formatTimer(elapsedSeconds)}</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl ${activeTutor.accentColor || 'bg-indigo-700'} flex items-center justify-center text-base font-bold text-white shrink-0`}
              >
                {activeTutor.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">{activeTutor.name}</p>
                <p className="text-xs text-slate-300 truncate">{activeTutor.category}</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Pizarra inteligente conectada al chat
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <label htmlFor="classroom-tutor-select" className="text-xs text-slate-300 font-medium shrink-0">
                Cambiar Asesor:
              </label>
              <select
                id="classroom-tutor-select"
                value={activeTutor.id}
                onChange={(e) => {
                  const found = tutors.find((t) => t.id === e.target.value);
                  if (found) {
                    onSelectTutor(found);
                    onNotify(`Cambiaste al Asesor: ${found.name}`);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-xs font-medium"
              >
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Chat */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden min-h-[340px]">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Chat de la Asesoría en Vivo
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Transcribe en pizarra
              </span>
            </div>

            <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto max-h-72 text-xs">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.isTyping
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-lg text-xs font-medium animate-pulse'
                      : m.isTutor
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 p-3 rounded-lg border border-slate-200 dark:border-slate-700'
                      : 'bg-indigo-600 text-white p-2.5 rounded-lg ml-6'
                  }
                >
                  {m.isTyping ? (
                    <span>{m.sender} está escribiendo y actualizando la pizarra...</span>
                  ) : (
                    <>
                      <p
                        className={`font-semibold text-[11px] mb-1 ${
                          m.isTutor ? 'text-indigo-700 dark:text-indigo-400' : 'text-indigo-100'
                        }`}
                      >
                        {m.sender}
                      </p>
                      <FormattedMessage text={m.text} />
                    </>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Escribe tu duda al asesor en vivo"
                placeholder="Escribe tu duda o ecuación al asesor..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
