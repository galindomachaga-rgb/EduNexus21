import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calculator,
  Sparkles,
  ExternalLink,
  Users,
  MessageSquare,
  Award,
  TrendingUp,
  X,
  BookmarkPlus,
  Send,
} from 'lucide-react';
import {
  EXTERNAL_PLATFORMS,
  FlashcardItem,
  QUIZ_BANKS,
  QnaThread,
  GroupStudyRoom,
  TutorProfile,
} from '../data/seedData';
import {
  AcademicCategory,
  calculateUniversityGrades,
  evaluateScientificExpression,
} from '../utils/academicLogic';
import { consultAcademicAdvisor, generateAiFlashcards } from '../utils/aiClient';
import { FormattedMessage } from './FormattedMessage';

interface StudioViewProps {
  tutors: TutorProfile[];
  currentUserName: string;
  isVerifiedTutor: boolean;
  notesCount: number;
  flashcardDecks: Record<string, FlashcardItem[]>;
  onUpdateFlashcards: (decks: Record<string, FlashcardItem[]>) => void;
  qnaThreads: QnaThread[];
  onUpdateQna: (threads: QnaThread[]) => void;
  groupRooms: GroupStudyRoom[];
  onUpdateGroupRooms: (rooms: GroupStudyRoom[]) => void;
  weeklyHours: number[];
  onLogExtraHour: () => void;
  onSaveNote: (title: string, category: AcademicCategory, body: string) => void;
  onGoClassroom: () => void;
  onNotify: (msg: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  tutors,
  currentUserName,
  isVerifiedTutor,
  notesCount,
  flashcardDecks,
  onUpdateFlashcards,
  qnaThreads,
  onUpdateQna,
  groupRooms,
  onUpdateGroupRooms,
  weeklyHours,
  onLogExtraHour,
  onSaveNote,
  onGoClassroom,
  onNotify,
}) => {
  // 1. Pomodoro State
  const [pomoMode, setPomoMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSound, setPomoSound] = useState(true);
  const [pomoCompleted, setPomoCompleted] = useState(0);
  const [studyTasks, setStudyTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: 'st-1', text: 'Repasar fórmulas de derivación e integrales', done: false },
    { id: 'st-2', text: 'Practicar 10 flashcards de vocabulario TOEFL', done: true },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (!pomoRunning) return;
    const interval = setInterval(() => {
      setPomoSeconds((prev) => {
        if (prev > 1) return prev - 1;
        setPomoRunning(false);
        setPomoCompleted((c) => c + 1);
        if (pomoSound) {
          try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch {
            // Audio context blocked
          }
        }
        onNotify('¡Ciclo Pomodoro completado con éxito!');
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomoRunning, pomoSound, onNotify]);

  const handleSelectPomoMode = (mode: 'focus' | 'short' | 'long') => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoSeconds(mode === 'focus' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60);
  };

  const formatPomoTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // 2. Flashcards & Quick Calculator State
  const [deckKey, setDeckKey] = useState<string>('calculo');
  const [cardIdx, setCardIdx] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('= 0');

  const currentDeck = flashcardDecks[deckKey] || [];
  const safeCardIdx = currentDeck.length > 0 ? ((cardIdx % currentDeck.length) + currentDeck.length) % currentDeck.length : 0;
  const currentCard = currentDeck[safeCardIdx];

  const handleAiGenerateCards = async () => {
    setIsGeneratingCards(true);
    const cards = await generateAiFlashcards(deckKey);
    const updated = {
      ...flashcardDecks,
      [deckKey]: [...(flashcardDecks[deckKey] || []), ...cards],
    };
    onUpdateFlashcards(updated);
    setCardIdx((updated[deckKey]?.length || 2) - 2);
    setShowingBack(false);
    setIsGeneratingCards(false);
    onNotify('Se generaron 2 nuevas tarjetas de estudio con IA');
  };

  const handleCreateCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    const updated = {
      ...flashcardDecks,
      [deckKey]: [
        ...(flashcardDecks[deckKey] || []),
        { front: newCardFront.trim(), back: newCardBack.trim() },
      ],
    };
    onUpdateFlashcards(updated);
    setCardIdx(updated[deckKey].length - 1);
    setShowingBack(false);
    setNewCardFront('');
    setNewCardBack('');
    setShowNewCardModal(false);
    onNotify('Nueva tarjeta añadida al mazo actual');
  };

  // 3. Quiz Simulator State
  const [quizTopic, setQuizTopic] = useState<'calculo' | 'programacion' | 'tesis'>('calculo');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizGraded, setQuizGraded] = useState(false);

  const currentQuestions = QUIZ_BANKS[quizTopic] || [];
  const quizCorrectCount = currentQuestions.reduce((acc, q, idx) => {
    return acc + (quizAnswers[idx] === q.correct ? 1 : 0);
  }, 0);

  // 4. University Weighted Average Calculator (0-20)
  const [gradePc, setGradePc] = useState<number>(13);
  const [gradeEp, setGradeEp] = useState<number>(11);
  const [gradeEf, setGradeEf] = useState<number>(14);
  const uniGradeResult = calculateUniversityGrades(gradePc, gradeEp, gradeEf);

  // 5. Q&A Forum State
  const [qnaCourse, setQnaCourse] = useState('Cálculo y Matemáticas');
  const [qnaQuestionText, setQnaQuestionText] = useState('');
  const [qnaReplyInputs, setQnaReplyInputs] = useState<Record<string, string>>({});
  const [isPostingQna, setIsPostingQna] = useState(false);

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = qnaQuestionText.trim();
    if (!q) return;
    setIsPostingQna(true);
    setQnaQuestionText('');

    const catMap: Record<string, { cat: AcademicCategory; advisor: string }> = {
      'Cálculo y Matemáticas': { cat: 'Matemáticas y Ciencias', advisor: 'Dr. Alejandro Vargas' },
      'Programación y Datos': { cat: 'Programación y Datos', advisor: 'Ing. Sofía Huamán' },
      'Tesis y Metodología': { cat: 'Humanidades y Tesis', advisor: 'Mg. Valeria Alarcón' },
      'Física e Ingeniería': { cat: 'Ingeniería', advisor: 'Ing. Renato Cáceres' },
      'Idiomas y Certificaciones': { cat: 'Idiomas', advisor: 'Prof. Liam O’Connor' },
    };
    const mapped = catMap[qnaCourse] || { cat: 'Matemáticas y Ciencias', advisor: 'Dr. Alejandro Vargas' };

    const aiRes = await consultAcademicAdvisor({
      question: q,
      category: mapped.cat,
      advisorName: mapped.advisor,
      contextTitle: `Foro Académico 24/7 (${qnaCourse})`,
      style: 'paso_a_paso',
    });

    const newThread: QnaThread = {
      id: 'qna-' + Date.now(),
      course: qnaCourse,
      author: currentUserName,
      question: q,
      likes: 1,
      answers: [
        {
          author: `${mapped.advisor} · Agente IA (${mapped.cat})`,
          text: aiRes.reply,
        },
      ],
    };

    onUpdateQna([newThread, ...qnaThreads]);
    setIsPostingQna(false);
    onNotify(`Consulta publicada y respondida por el especialista de ${mapped.cat}`);
  };

  // 6. Group Study Rooms State
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState<AcademicCategory>('Matemáticas y Ciencias');
  const [newRoomMax, setNewRoomMax] = useState(8);
  const [activeGroupRoomId, setActiveGroupRoomId] = useState<string | null>(null);
  const [groupChatInput, setGroupChatInput] = useState('');

  const activeGroupRoom = groupRooms.find((r) => r.id === activeGroupRoomId) || null;

  const handleCreateGroupRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    const newRoom: GroupStudyRoom = {
      id: 'grp-' + Date.now(),
      title: newRoomTitle.trim(),
      category: newRoomCategory,
      maxMembers: newRoomMax,
      members: [currentUserName, 'Compañero en Línea'],
      sharedNotes: `# ${newRoomTitle.trim()}\n• Sala creada por ${currentUserName} (${newRoomCategory}).\n• Escriban aquí las fórmulas y conclusiones del equipo.`,
      chat: [
        {
          sender: `Moderador IA (${newRoomCategory})`,
          text: `¡Bienvenidos a la sala "${newRoomTitle.trim()}"! Pueden debatir en este chat o presionarme arriba para resolver un ejercicio en equipo.`,
          isAi: true,
        },
      ],
    };
    onUpdateGroupRooms([newRoom, ...groupRooms]);
    setNewRoomTitle('');
    setActiveGroupRoomId(newRoom.id);
    onNotify('Sala grupal creada y abierta en vivo');
  };

  const handleJoinGroupRoom = (roomId: string) => {
    const updated = groupRooms.map((r) => {
      if (r.id === roomId && !r.members.includes(currentUserName) && r.members.length < r.maxMembers) {
        return { ...r, members: [...r.members, currentUserName] };
      }
      return r;
    });
    onUpdateGroupRooms(updated);
    setActiveGroupRoomId(roomId);
  };

  const handleSendGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupRoom || !groupChatInput.trim()) return;
    const msg = groupChatInput.trim();
    setGroupChatInput('');

    const withUserMsg = groupRooms.map((r) =>
      r.id === activeGroupRoom.id
        ? { ...r, chat: [...r.chat, { sender: currentUserName, text: msg, isAi: false }] }
        : r
    );
    onUpdateGroupRooms(withUserMsg);

    const tutorForCat = tutors.find((t) => t.category === activeGroupRoom.category) || tutors[0];
    const aiRes = await consultAcademicAdvisor({
      question: msg,
      category: activeGroupRoom.category,
      advisorName: tutorForCat.name,
      contextTitle: `Sala Grupal: ${activeGroupRoom.title}`,
      style: 'paso_a_paso',
    });

    onUpdateGroupRooms(
      withUserMsg.map((r) =>
        r.id === activeGroupRoom.id
          ? {
              ...r,
              chat: [
                ...r.chat,
                {
                  sender: `${tutorForCat.name} (Moderador IA · ${activeGroupRoom.category})`,
                  text: aiRes.reply,
                  isAi: true,
                },
              ],
            }
          : r
      )
    );
  };

  // 7. Weekly Study Analytics Chart Canvas
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent && parent.clientWidth > 100 ? parent.clientWidth : 460;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const maxVal = Math.max(...weeklyHours, 4);
    const barW = Math.min(38, Math.floor((w - 70) / 10));
    const gap = Math.floor((w - 50 - barW * 7) / 6);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, h - 28);
    ctx.lineTo(w - 16, h - 28);
    ctx.stroke();

    weeklyHours.forEach((val, idx) => {
      const bx = 28 + idx * (barW + gap);
      const bh = Math.round((val / maxVal) * (h - 62));
      const by = h - 28 - bh;

      ctx.fillStyle = idx === 6 ? '#059669' : '#4f46e5';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bx, by, barW, bh, 6);
      } else {
        ctx.rect(bx, by, barW, bh);
      }
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${val.toFixed(1)}h`, bx + barW / 2, by - 6);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "DM Sans", sans-serif';
      ctx.fillText(labels[idx], bx + barW / 2, h - 12);
    });
  }, [weeklyHours]);

  const totalWeeklyHours = weeklyHours.reduce((a, b) => a + b, 0);

  return (
    <section aria-label="Plataforma y Herramientas de Estudio" className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Centro de Productividad Académica
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Plataformas y Herramientas de Estudio Online
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Conecta tus plataformas de Google Workspace y estudia con Pomodoro, Flashcards 3D, Calculadora Vigesimal y Simulacros.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoClassroom}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition whitespace-nowrap shrink-0"
        >
          Abrir Pizarra y Aula Virtual →
        </button>
      </div>

      {/* External Platforms Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Acceso Directo a Plataformas Académicas y Google Workspace
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Lanzamiento directo en nueva pestaña
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {EXTERNAL_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2 transition group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{p.category}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:text-indigo-600 transition" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {p.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Row 1: Pomodoro Focus Timer (5 cols) + Flashcards 3D & Scientific Calculator (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Pomodoro Timer */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Temporizador Pomodoro Pro
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ciclos de concentración con alerta sonora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPomoSound((s) => !s)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {pomoSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{pomoSound ? 'Sonido: Activo' : 'Silencio'}</span>
              </button>
            </div>

            {/* Segmented Mode Control */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mt-4">
              <button
                type="button"
                onClick={() => handleSelectPomoMode('focus')}
                className={`py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                  pomoMode === 'focus'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Enfoque (25m)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPomoMode('short')}
                className={`py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                  pomoMode === 'short'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Descanso (5m)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPomoMode('long')}
                className={`py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                  pomoMode === 'long'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Largo (15m)
              </button>
            </div>

            {/* Display */}
            <div className="my-6 text-center">
              <div className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                {formatPomoTime(pomoSeconds)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {pomoRunning
                  ? 'Concentración activa en curso...'
                  : 'Listo para iniciar sesión de estudio'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPomoRunning((r) => !r)}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition whitespace-nowrap shrink-0"
              >
                {pomoRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                type="button"
                onClick={() => handleSelectPomoMode(pomoMode)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition whitespace-nowrap shrink-0"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Metas de la sesión actual
              </span>
              <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                {pomoCompleted} ciclos completados
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskText.trim()) {
                    e.preventDefault();
                    setStudyTasks((prev) => [
                      ...prev,
                      { id: 'st-' + Date.now(), text: newTaskText.trim(), done: false },
                    ]);
                    setNewTaskText('');
                  }
                }}
                placeholder="Ej. Resolver guía de integrales..."
                aria-label="Nueva meta de estudio"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTaskText.trim()) return;
                  setStudyTasks((prev) => [
                    ...prev,
                    { id: 'st-' + Date.now(), text: newTaskText.trim(), done: false },
                  ]);
                  setNewTaskText('');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Añadir
              </button>
            </div>

            <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {studyTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) =>
                        setStudyTasks((prev) =>
                          prev.map((t) => (t.id === task.id ? { ...t, done: e.target.checked } : t))
                        )
                      }
                      className="rounded text-indigo-600"
                    />
                    <span
                      className={
                        task.done
                          ? 'line-through text-slate-400'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
                      }
                    >
                      {task.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Eliminar tarea ${task.text}`}
                    onClick={() => setStudyTasks((prev) => prev.filter((t) => t.id !== task.id))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Flashcards 3D & Scientific Calculator */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tarjetas de Memoria (Flashcards Activas)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Repaso espaciado por materia o generación automática con IA
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deckKey}
                onChange={(e) => {
                  setDeckKey(e.target.value);
                  setCardIdx(0);
                  setShowingBack(false);
                }}
                aria-label="Seleccionar mazo de flashcards"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="calculo">Mazo: Cálculo & Derivadas</option>
                <option value="programacion">Mazo: Python & Estructuras</option>
                <option value="ingles">Mazo: Inglés Académico TOEFL</option>
              </select>

              <button
                type="button"
                disabled={isGeneratingCards}
                onClick={handleAiGenerateCards}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingCards ? 'Generando...' : 'Generar con IA'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewCardModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Interactive Card Surface */}
          <button
            type="button"
            onClick={() => setShowingBack((b) => !b)}
            className="w-full h-52 cursor-pointer select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-6 flex flex-col items-center justify-center text-center transition hover:border-indigo-400 relative"
          >
            <span className="absolute top-3 left-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {showingBack ? 'Respuesta / Explicación' : 'Pregunta / Concepto'}
            </span>
            <span className="absolute top-3 right-4 text-xs font-mono tabular-nums text-slate-400">
              {safeCardIdx + 1} / {currentDeck.length}
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 max-w-lg leading-relaxed">
              {currentCard ? (showingBack ? currentCard.back : currentCard.front) : 'Sin tarjetas'}
            </p>
            <span className="absolute bottom-3 text-[11px] text-slate-400">
              Haz clic en la tarjeta para voltear
            </span>
          </button>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardIdx((i) => i - 1);
                  setShowingBack(false);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => setShowingBack((b) => !b)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Voltear Tarjeta
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardIdx((i) => i + 1);
                  setShowingBack(false);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                Siguiente →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardIdx((i) => i + 1);
                  setShowingBack(false);
                  onNotify('Tarjeta marcada para repasar luego');
                }}
                className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium whitespace-nowrap shrink-0"
              >
                Repasar luego
              </button>
              <button
                type="button"
                onClick={() => {
                  setMasteredCount((c) => c + 1);
                  setCardIdx((i) => i + 1);
                  setShowingBack(false);
                  onNotify('Tarjeta marcada como dominada');
                }}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium whitespace-nowrap shrink-0"
              >
                Dominada ({masteredCount})
              </button>
            </div>
          </div>

          {/* Quick Scientific Calculator */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Calculadora Rápida:</span>
            </span>
            <input
              type="text"
              value={calcExpr}
              onChange={(e) => setCalcExpr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setCalcResult(evaluateScientificExpression(calcExpr).formatted);
                }
              }}
              aria-label="Expresión matemática para calcular"
              placeholder="Ej: (15*4) + sqrt(144) o 2^8"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setCalcResult(evaluateScientificExpression(calcExpr).formatted)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Calcular
            </button>
            <span className="text-xs font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300 px-2 shrink-0">
              {calcResult}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Self-Grading Exam Simulator */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Simulador de Examen Rápido Autocalificable
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pon a prueba lo aprendido con preguntas tipo parcial y explicación inmediata
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={quizTopic}
              onChange={(e) => {
                setQuizTopic(e.target.value as 'calculo' | 'programacion' | 'tesis');
                setQuizAnswers({});
                setQuizGraded(false);
              }}
              aria-label="Seleccionar materia del examen simulacro"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="calculo">Examen: Cálculo y Matemáticas</option>
              <option value="programacion">Examen: Python, SQL y Algoritmos</option>
              <option value="tesis">Examen: Metodología y Normas APA 7</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setQuizAnswers({});
                setQuizGraded(false);
                onNotify('Simulacro reiniciado');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Test</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentQuestions.map((item, qIdx) => {
            const userChoice = quizAnswers[qIdx];
            const isCorrect = userChoice === item.correct;
            return (
              <div
                key={qIdx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {item.q}
                  </p>
                  <div className="space-y-1.5">
                    {item.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition ${
                          userChoice === oIdx
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-medium'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-q-${qIdx}`}
                          checked={userChoice === oIdx}
                          onChange={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          className="text-indigo-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {quizGraded && (
                  <div
                    className={`text-[11px] p-2.5 rounded-lg font-medium border ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {isCorrect
                      ? `Correcto: ${item.explanation}`
                      : `Respuesta correcta (${item.options[item.correct]}): ${item.explanation}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            <span>Puntaje del Simulacro: </span>
            <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
              {quizGraded ? `${quizCorrectCount} / ${currentQuestions.length} correctas` : `0 / ${currentQuestions.length} calificadas`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuizGraded(true);
              onNotify(`Obtuviste ${quizCorrectCount} de ${currentQuestions.length} respuestas correctas`);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Calificar Respuestas y Ver Explicación</span>
          </button>
        </div>
      </div>

      {/* Row 3: University Weighted Average Calculator (0-20 Scale) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Simulador de Promedio Ponderado y Meta de Examen Final (Escala 0–20)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calcula tu promedio actual de curso y descubre qué nota necesitas en el Examen Final para aprobar (10.5) o lograr excelencia (16.0)
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sistema Vigesimal Universitario
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label htmlFor="grade-pc-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Promedio de Prácticas (PC) · 30%
            </label>
            <input
              id="grade-pc-input"
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={gradePc}
              onChange={(e) => setGradePc(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
            />
            <span className="text-[11px] text-slate-400 block">Escala de 0 a 20 puntos</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label htmlFor="grade-ep-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Examen Parcial (EP) · 30%
            </label>
            <input
              id="grade-ep-input"
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={gradeEp}
              onChange={(e) => setGradeEp(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
            />
            <span className="text-[11px] text-slate-400 block">Escala de 0 a 20 puntos</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label htmlFor="grade-ef-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nota Proyectada Final (EF) · 40%
            </label>
            <input
              id="grade-ef-input"
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={gradeEf}
              onChange={(e) => setGradeEf(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900"
            />
            <span className="text-[11px] text-slate-400 block">Peso del Examen Final: 40%</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400">Promedio Final Calculado</span>
              <p
                className={`text-2xl font-mono tabular-nums font-bold mt-0.5 ${
                  uniGradeResult.average >= 10.5 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {uniGradeResult.average.toFixed(2)} / 20
              </p>
              <p className="text-xs text-slate-300 mt-1">{uniGradeResult.statusLabel}</p>
            </div>
            <p className="text-[11px] text-indigo-300 font-mono tabular-nums mt-2">
              Meta Décimo Superior (16.0): {uniGradeResult.neededForExcellence.toFixed(2)} pts
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: 24/7 Academic Q&A Forum */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Foro de Consultas Académicas 24/7 (Comunidad & Asesores)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publica una duda puntual y recibe respuesta inmediata del especialista del área
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {qnaThreads.length} debates activos
          </span>
        </div>

        <form
          onSubmit={handlePostQuestion}
          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="md:col-span-3">
            <select
              value={qnaCourse}
              onChange={(e) => setQnaCourse(e.target.value)}
              aria-label="Área de la consulta académica"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="Cálculo y Matemáticas">Cálculo y Matemáticas</option>
              <option value="Programación y Datos">Programación y Datos</option>
              <option value="Tesis y Metodología">Tesis y Metodología</option>
              <option value="Física e Ingeniería">Física e Ingeniería</option>
              <option value="Idiomas y Certificaciones">Idiomas y Certificaciones</option>
            </select>
          </div>
          <div className="md:col-span-7">
            <input
              type="text"
              required
              value={qnaQuestionText}
              onChange={(e) => setQnaQuestionText(e.target.value)}
              placeholder="Escribe tu consulta académica (ej. ¿Cuándo aplicar integración por sustitución trigonométrica?)..."
              aria-label="Escribe tu consulta académica para el foro"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPostingQna}
              className="w-full h-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs whitespace-nowrap"
            >
              {isPostingQna ? 'Publicando...' : 'Publicar Duda'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {qnaThreads.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {t.course}
                  </span>
                  <span className="mx-2">·</span>
                  <span>Preguntado por {t.author}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQna(
                      qnaThreads.map((x) => (x.id === t.id ? { ...x, likes: x.likes + 1 } : x))
                    )
                  }
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                >
                  ▲ Útil ({t.likes})
                </button>
              </div>

              <p className="text-sm font-bold text-slate-900 dark:text-white">{t.question}</p>

              <div className="space-y-2">
                {t.answers.map((a, aIdx) => (
                  <div
                    key={aIdx}
                    className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <p className="font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
                      {a.author}
                    </p>
                    <FormattedMessage text={a.text} />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={qnaReplyInputs[t.id] || ''}
                  onChange={(e) =>
                    setQnaReplyInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                  }
                  placeholder="Escribe un aporte o respuesta..."
                  aria-label={`Responder al debate ${t.question}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    const replyTxt = (qnaReplyInputs[t.id] || '').trim();
                    if (!replyTxt) return;
                    onUpdateQna(
                      qnaThreads.map((x) =>
                        x.id === t.id
                          ? {
                              ...x,
                              answers: [
                                ...x.answers,
                                {
                                  author: `${currentUserName} (${isVerifiedTutor ? 'Asesor' : 'Estudiante'})`,
                                  text: replyTxt,
                                },
                              ],
                            }
                          : x
                      )
                    );
                    setQnaReplyInputs((prev) => ({ ...prev, [t.id]: '' }));
                    onNotify('Respuesta publicada en el foro académico');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Responder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: Collaborative Group Study Rooms */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Salas Grupales de Estudio Colaborativo en Vivo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Únete a mesas de estudio con otros alumnos, compartan apuntes y consulten juntos al Moderador IA
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {groupRooms.length} salas activas
          </span>
        </div>

        <form
          onSubmit={handleCreateGroupRoom}
          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="md:col-span-5">
            <input
              type="text"
              required
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="Nombre de tu sala (ej. Repaso Final Cálculo II - Grupo UNI)..."
              aria-label="Nombre de la nueva sala grupal"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={newRoomCategory}
              onChange={(e) => setNewRoomCategory(e.target.value as AcademicCategory)}
              aria-label="Categoría de la sala grupal"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="Matemáticas y Ciencias">Matemáticas y Ciencias</option>
              <option value="Programación y Datos">Programación y Datos</option>
              <option value="Humanidades y Tesis">Humanidades y Tesis</option>
              <option value="Negocios y Finanzas">Negocios y Finanzas</option>
              <option value="Ingeniería">Ingeniería</option>
              <option value="Idiomas">Idiomas</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={newRoomMax}
              onChange={(e) => setNewRoomMax(Number(e.target.value))}
              aria-label="Capacidad máxima de alumnos"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value={6}>Máx: 6 alumnos</option>
              <option value={8}>Máx: 8 alumnos</option>
              <option value={10}>Máx: 10 alumnos</option>
              <option value={15}>Máx: 15 alumnos</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs whitespace-nowrap"
            >
              + Crear Sala
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupRooms.map((rm) => (
            <div
              key={rm.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{rm.category}</span>
                  <span className="font-mono tabular-nums text-teal-700 dark:text-teal-400 font-semibold">
                    {rm.members.length}/{rm.maxMembers} conectados
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {rm.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Integrantes: {rm.members.slice(0, 4).join(' · ')}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Pizarra + Moderador IA</span>
                <button
                  type="button"
                  onClick={() => handleJoinGroupRoom(rm.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs whitespace-nowrap shrink-0"
                >
                  Unirse a la Sala →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 6: Weekly Performance Analytics & Achievements */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Estadísticas de Rendimiento, Racha de Estudio y Logros
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitorea tu evolución semanal de estudio autónomo y desbloquea insignias académicas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogExtraHour}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition whitespace-nowrap shrink-0"
          >
            + Registrar +1 Hora de Estudio Hoy (+5 Pts)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Horas de Estudio & Consultas IA (Últimos 7 Días)</span>
              <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                Total semanal: {totalWeeklyHours.toFixed(1)} hrs
              </span>
            </div>
            <div className="relative h-52 w-full">
              <canvas ref={chartCanvasRef} className="w-full h-full block" />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Mis Insignias y Logros Desbloqueados</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  title: 'Racha Académica Activa',
                  desc: '7 días seguidos repasando en la plataforma',
                  unlocked: true,
                },
                {
                  title: 'Consultor IA Pro',
                  desc: 'Apuntes sincronizados con los Asesores IA en pizarra',
                  unlocked: true,
                },
                {
                  title: 'Autor de Apuntes Cloud',
                  desc: `${notesCount} cuadernos activos en tu biblioteca`,
                  unlocked: true,
                },
                {
                  title: 'Cuenta Docente SUNEDU',
                  desc: isVerifiedTutor
                    ? 'Documento acreditado y verificado'
                    : 'Valida tu doc. para desbloquear',
                  unlocked: isVerifiedTutor,
                },
              ].map((ach) => (
                <div
                  key={ach.title}
                  className={`p-3 rounded-xl border text-xs ${
                    ach.unlocked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <p className="font-bold leading-tight">{ach.title}</p>
                  <p className="text-[11px] mt-1 leading-snug text-slate-600 dark:text-slate-400">
                    {ach.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: New Flashcard */}
      {showNewCardModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-flashcard-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 id="new-flashcard-title" className="font-bold text-slate-900 dark:text-white text-base">
                Añadir Tarjeta al Mazo Actual
              </h3>
              <button
                type="button"
                aria-label="Cerrar modal de tarjeta"
                onClick={() => setShowNewCardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pregunta o Concepto (Frente)
                </label>
                <input
                  type="text"
                  required
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="Ej. ¿Cuál es la derivada de ln(x)?"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Respuesta o Explicación (Reverso)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="Ej. La derivada de ln(x) respecto a x es 1/x (para x > 0)."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Guardar Tarjeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Live Group Study Room */}
      {activeGroupRoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="group-room-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  {activeGroupRoom.category} · {activeGroupRoom.members.length}/{activeGroupRoom.maxMembers} alumnos en línea
                </p>
                <h3 id="group-room-modal-title" className="font-bold text-slate-900 dark:text-white text-lg mt-0.5">
                  {activeGroupRoom.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar sala grupal"
                onClick={() => setActiveGroupRoomId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Compañeros en la mesa: {activeGroupRoom.members.join(' · ')}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pizarra de Apuntes Colaborativos del Grupo
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onSaveNote(
                          `Apuntes Grupales: ${activeGroupRoom.title}`,
                          activeGroupRoom.category,
                          activeGroupRoom.sharedNotes
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Guardar en Mis Apuntes</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={activeGroupRoom.sharedNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateGroupRooms(
                        groupRooms.map((r) =>
                          r.id === activeGroupRoom.id ? { ...r, sharedNotes: val } : r
                        )
                      );
                    }}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono leading-relaxed bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between space-y-3 min-h-[290px]">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Chat Grupal & Moderador IA
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const tutorForCat =
                        tutors.find((t) => t.category === activeGroupRoom.category) || tutors[0];
                      const res = await consultAcademicAdvisor({
                        question: `Revisa nuestros apuntes grupales y danos un consejo clave o ejercicio para practicar: ${activeGroupRoom.sharedNotes.slice(0, 140)}`,
                        category: activeGroupRoom.category,
                        advisorName: tutorForCat.name,
                        contextTitle: activeGroupRoom.title,
                      });
                      onUpdateGroupRooms(
                        groupRooms.map((r) =>
                          r.id === activeGroupRoom.id
                            ? {
                                ...r,
                                chat: [
                                  ...r.chat,
                                  {
                                    sender: `${tutorForCat.name} (Moderador IA)`,
                                    text: res.reply,
                                    isAi: true,
                                  },
                                ],
                              }
                            : r
                        )
                      );
                      onNotify('El Moderador IA aportó una explicación al grupo');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Pedir Ayuda IA</span>
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-60 pr-1 text-xs">
                  {activeGroupRoom.chat.map((m, idx) => (
                    <div
                      key={idx}
                      className={
                        m.isAi
                          ? 'p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 space-y-1'
                          : 'p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      }
                    >
                      <p className="font-bold text-indigo-700 dark:text-indigo-400 text-[11px]">
                        {m.sender}
                      </p>
                      <FormattedMessage text={m.text} />
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendGroupChat} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    required
                    value={groupChatInput}
                    onChange={(e) => setGroupChatInput(e.target.value)}
                    placeholder="Escribe al grupo o pregunta una duda..."
                    aria-label="Mensaje para el chat grupal"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
