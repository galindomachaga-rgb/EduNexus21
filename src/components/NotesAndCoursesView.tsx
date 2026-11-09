import React, { useState } from 'react';
import {
  Play,
  Download,
  Award,
  CheckCircle2,
  BookOpen,
  FileText,
  Upload,
  Sparkles,
  Volume2,
  Send,
  Search,
  Plus,
  Trash2,
  Share2,
  Heart,
  Copy,
  Eye,
  X,
  CheckSquare,
  ListChecks,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import {
  CourseItem,
  NoteItem,
  CommunityNoteItem,
  TutorMaterialItem,
  TutorProfile,
} from '../data/seedData';
import { AcademicCategory, CurrencyCode, formatCurrency } from '../utils/academicLogic';
import { consultAcademicAdvisor, downloadOfflineClassPackage } from '../utils/aiClient';
import { FormattedMessage } from './FormattedMessage';

interface CoursesViewProps {
  courses: CourseItem[];
  setCourses: React.Dispatch<React.SetStateAction<CourseItem[]>>;
  tutors: TutorProfile[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  currency: CurrencyCode;
  studentName: string;
  onOpenCertificate: (title: string, instructor: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  setCourses,
  tutors,
  setNotes,
  currency,
  studentName,
  onOpenCertificate,
  showToast,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<
    'classes' | 'syllabus' | 'materials' | 'assignments' | 'announcements' | 'ai'
  >('classes');
  const [activeModuleIdx, setActiveModuleIdx] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1x');

  // Course Workspace state
  const [aiRoutineHtml, setAiRoutineHtml] = useState<string>('');
  const [aiRoutineLoading, setAiRoutineLoading] = useState<boolean>(false);

  // Assignment state
  const [submissionText, setSubmissionText] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [assignmentStatus, setAssignmentStatus] = useState<'pending' | 'graded'>('pending');
  const [aiFeedbackText, setAiFeedbackText] = useState<string>('');
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState<boolean>(false);

  // Forum state inside course
  const [forumInput, setForumInput] = useState<string>('');

  // Course AI Advisor state
  const [aiStyle, setAiStyle] = useState<'rigorous' | 'intuitive' | 'exam'>('rigorous');
  const [courseAiMessages, setCourseAiMessages] = useState<
    Record<string, { sender: 'user' | 'ai'; text: string }[]>
  >({});
  const [courseAiInput, setCourseAiInput] = useState<string>('');
  const [courseAiLoading, setCourseAiLoading] = useState<boolean>(false);

  const filteredCourses =
    categoryFilter === 'all'
      ? courses
      : courses.filter((c) => c.category === categoryFilter);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  const findCourseTutor = (course: CourseItem): TutorProfile => {
    const matched = tutors.find(
      (t) =>
        course.instructor.toLowerCase().includes(t.name.split(' ')[1]?.toLowerCase() || '') ||
        t.category === course.category
    );
    return matched || tutors[0];
  };

  const openCourseWorkspace = (courseId: string) => {
    setActiveCourseId(courseId);
    setWorkspaceTab('classes');
    setActiveModuleIdx(0);
    setAiRoutineHtml('');
    setAiFeedbackText('');
    setAssignmentStatus('pending');
    const c = courses.find((item) => item.id === courseId);
    if (c && !courseAiMessages[courseId]) {
      setCourseAiMessages((prev) => ({
        ...prev,
        [courseId]: [
          {
            sender: 'ai',
            text: `¡Hola! Soy el **Asesor IA Especializado** del curso **${c.title}** entrenado con la metodología de **${c.instructor}**. ¿Qué módulo, teorema o ejercicio deseas resolver paso a paso?`,
          },
        ],
      }));
    }
  };

  const toggleModuleCompletion = (courseId: string, modIdx: number) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const updatedModules = c.modules.map((m, idx) =>
          idx === modIdx ? { ...m, done: !m.done } : m
        );
        return { ...c, modules: updatedModules };
      })
    );
    showToast('Progreso del módulo actualizado', 'success');
  };

  const handleGenerateRoutine = async () => {
    if (!activeCourse) return;
    setAiRoutineLoading(true);
    const tutor = findCourseTutor(activeCourse);
    const modList = activeCourse.modules.map((m) => m.title).join(', ');
    const res = await consultAcademicAdvisor({
      question: `Genera un cronograma de estudio intensivo de 4 semanas para dominar el curso "${activeCourse.title}" con los módulos: ${modList}. Incluye metas semanales, técnica de repaso espaciado y ejercicios clave.`,
      category: activeCourse.category,
      advisorName: activeCourse.instructor,
      contextTitle: activeCourse.title,
      tags: tutor.tags,
    });
    setAiRoutineHtml(res.reply);
    setAiRoutineLoading(false);
    showToast('Rutina de estudio generada con IA', 'success');
  };

  const handleAskAssignmentHint = async () => {
    if (!activeCourse) return;
    setAiFeedbackLoading(true);
    const tutor = findCourseTutor(activeCourse);
    const res = await consultAcademicAdvisor({
      question: `Dame una pista metodológica y las fórmulas clave para resolver la práctica calificada del curso "${activeCourse.title}". Mi avance actual es: "${submissionText || 'Recién voy a plantear el problema'}".`,
      category: activeCourse.category,
      advisorName: activeCourse.instructor,
      contextTitle: activeCourse.title,
      tags: tutor.tags,
    });
    setAiFeedbackText(res.reply);
    setAiFeedbackLoading(false);
  };

  const handleSubmitAssignment = () => {
    if (!submissionText.trim() && !attachedFileName) {
      showToast('Escribe tu desarrollo o adjunta un archivo antes de entregar', 'warning');
      return;
    }
    setAssignmentStatus('graded');
    setAiFeedbackText(
      `### Calificación Oficial: 19 / 20 (Sobresaliente)\n\n- **Planteamiento formal (5/5):** Excelente definición de variables e hipótesis.\n- **Desarrollo analítico (9/10):** Procedimiento riguroso y bien justificado.\n- **Conclusión e interpretación (5/5):** Resultados verificados correctamente.`
    );
    showToast('Práctica calificada: 19/20 (+50 XP)', 'success');
  };

  const handlePostCourseQuestion = () => {
    if (!activeCourse || !forumInput.trim()) return;
    const text = forumInput.trim();
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== activeCourse.id) return c;
        return {
          ...c,
          comments: [
            { author: studentName, text },
            {
              author: `${activeCourse.instructor} (Docente)`,
              text: `Excelente consulta sobre el Módulo ${activeModuleIdx + 1}. Recuerda verificar las hipótesis previas antes de aplicar la propiedad general.`,
            },
            ...(c.comments || []),
          ],
        };
      })
    );
    setForumInput('');
    showToast('Consulta publicada en el foro del curso', 'success');
  };

  const handleSendCourseAiMessage = async (customPrompt?: string) => {
    if (!activeCourse) return;
    const text = (customPrompt ?? courseAiInput).trim();
    if (!text || courseAiLoading) return;

    const currentList = courseAiMessages[activeCourse.id] || [];
    setCourseAiMessages((prev) => ({
      ...prev,
      [activeCourse.id]: [...currentList, { sender: 'user', text }],
    }));
    if (!customPrompt) setCourseAiInput('');
    setCourseAiLoading(true);

    const tutor = findCourseTutor(activeCourse);
    const currentModTitle = activeCourse.modules[activeModuleIdx]?.title || 'Módulo 1';

    const res = await consultAcademicAdvisor({
      question: `[Módulo actual: ${currentModTitle}] ${text}`,
      category: activeCourse.category,
      advisorName: activeCourse.instructor,
      contextTitle: activeCourse.title,
      style: aiStyle,
      tags: tutor.tags,
    });

    setCourseAiMessages((prev) => ({
      ...prev,
      [activeCourse.id]: [
        ...(prev[activeCourse.id] || []),
        { sender: 'ai', text: res.reply },
      ],
    }));
    setCourseAiLoading(false);
  };

  const handleSpeakLastAiMessage = () => {
    if (!activeCourse) return;
    const msgs = courseAiMessages[activeCourse.id] || [];
    const lastAi = [...msgs].reverse().find((m) => m.sender === 'ai');
    if (!lastAi) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        lastAi.text.replace(/[#*`]/g, '')
      );
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
      showToast('Reproduciendo explicación por voz...', 'info');
    } else {
      showToast('Tu navegador no soporta síntesis de voz', 'warning');
    }
  };

  const handleSaveAiToNotes = () => {
    if (!activeCourse) return;
    const msgs = courseAiMessages[activeCourse.id] || [];
    const lastAi = [...msgs].reverse().find((m) => m.sender === 'ai');
    if (!lastAi) return;
    const modTitle = activeCourse.modules[activeModuleIdx]?.title || 'General';
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title: `Apunte IA: ${activeCourse.title} (${modTitle})`,
      category: activeCourse.category,
      updatedAt: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body: `# ${activeCourse.title}\n**Módulo:** ${modTitle}\n**Instructor:** ${activeCourse.instructor}\n\n---\n\n${lastAi.text}`,
    };
    setNotes((prev) => [newNote, ...prev]);
    showToast('Explicación guardada en Mis Apuntes', 'success');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-lg border border-indigo-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 block mb-2">
              Academia & Aprendizaje Asíncrono + Offline
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Cursos Grabados, Clases Descargables y Rutas de Estudio
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base">
              Estudia a tu propio ritmo con cursos modulares creados por nuestros asesores verificados. Descarga paquetes de estudio offline (.HTML), entrega prácticas y obtén certificados verificados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'Matemáticas y Ciencias', label: 'Matemáticas y Ciencias' },
              { id: 'Programación y Datos', label: 'Programación y Datos' },
              { id: 'Humanidades y Tesis', label: 'Humanidades y Tesis' },
              { id: 'Negocios y Finanzas', label: 'Negocios' },
              { id: 'Idiomas', label: 'Idiomas' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'bg-indigo-800/50 text-indigo-200 hover:bg-indigo-800 border border-indigo-700/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const doneCount = course.modules.filter((m) => m.done).length;
          const progress =
            course.modules.length > 0
              ? Math.round((doneCount / course.modules.length) * 100)
              : 0;
          return (
            <article
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 flex flex-col justify-between text-white relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-md font-semibold">
                      {course.category}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-1 rounded-md">
                      {formatCurrency(course.price, currency)} · {course.students} est.
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-snug line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-white/85">{course.instructor}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">
                    <span>{course.modules.length} módulos</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {progress}% completado ({doneCount}/{course.modules.length})
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Módulos del Sílabo:
                    </p>
                    {course.modules.slice(0, 3).map((mod, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 truncate"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            mod.done
                              ? 'text-emerald-500'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{mod.title}</span>
                      </div>
                    ))}
                    {course.modules.length > 3 && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pl-5">
                        + {course.modules.length - 3} módulos adicionales
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                <button
                  onClick={() => openCourseWorkspace(course.id)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Abrir Aula del Curso & Asesor IA
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      downloadOfflineClassPackage(
                        course.title,
                        course.instructor,
                        course.category,
                        `Módulos incluidos:\n${course.modules.map((m, i) => `${i + 1}. ${m.title}`).join('\n')}`,
                        studentName
                      );
                      showToast('Paquete de clase offline (.HTML) descargado', 'success');
                    }}
                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Offline .HTML
                  </button>
                  <button
                    onClick={() => onOpenCertificate(course.title, course.instructor)}
                    className="py-2 px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Certificado
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Course Workspace Modal (6 Tabs) */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/80 mb-1">
                  <span>{activeCourse.category}</span>
                  <span>•</span>
                  <span>{activeCourse.instructor}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold">{activeCourse.title}</h2>
              </div>
              <button
                onClick={() => setActiveCourseId(null)}
                className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
                aria-label="Cerrar curso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Workspace Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto shrink-0">
              {[
                { id: 'classes', label: '1. Clases y Descargas', icon: Play },
                { id: 'syllabus', label: '2. Sílabo y Cronograma', icon: ListChecks },
                { id: 'materials', label: '3. Materiales del Curso', icon: BookOpen },
                { id: 'assignments', label: '4. Prácticas y Entregas', icon: CheckSquare },
                { id: 'announcements', label: '5. Avisos y Dudas', icon: MessageSquare },
                { id: 'ai', label: '6. Asesor IA del Curso', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceTab(tab.id as typeof workspaceTab)}
                    className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                      workspaceTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {/* TAB 1: CLASES Y DESCARGAS */}
              {workspaceTab === 'classes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-950 rounded-2xl aspect-video p-6 flex flex-col justify-between text-white relative overflow-hidden border border-slate-800">
                      <div className="flex items-center justify-between z-10">
                        <span className="text-xs font-mono bg-indigo-600/90 px-2.5 py-1 rounded-md font-bold">
                          MÓDULO {activeModuleIdx + 1} DE {activeCourse.modules.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {['1x', '1.25x', '1.5x', '2x'].map((spd) => (
                            <button
                              key={spd}
                              onClick={() => setPlaybackSpeed(spd)}
                              className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer ${
                                playbackSpeed === spd
                                  ? 'bg-white text-slate-900'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {spd}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="my-auto text-center max-w-lg mx-auto z-10">
                        <p className="text-xs uppercase tracking-widest text-indigo-400 font-mono mb-2">
                          Reproductor Académico HD ({playbackSpeed})
                        </p>
                        <h3 className="text-xl sm:text-2xl font-extrabold mb-3">
                          {activeCourse.modules[activeModuleIdx]?.title}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Sesión magistral grabada por {activeCourse.instructor} con desarrollo paso a paso y ejercicios tipo evaluación universitaria.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 z-10">
                        <button
                          onClick={() => toggleModuleCompletion(activeCourse.id, activeModuleIdx)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {activeCourse.modules[activeModuleIdx]?.done
                            ? 'Módulo Completado ✓'
                            : 'Marcar como Completado'}
                        </button>
                        <button
                          onClick={() => {
                            downloadOfflineClassPackage(
                              `${activeCourse.title} - ${activeCourse.modules[activeModuleIdx]?.title}`,
                              activeCourse.instructor,
                              activeCourse.category,
                              `Módulo activo: ${activeCourse.modules[activeModuleIdx]?.title}`,
                              studentName
                            );
                            showToast('Clase descargada para estudio sin internet (.HTML)', 'success');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Descargar Clase Offline (.HTML)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Playlist */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                      Lista de Módulos ({activeCourse.modules.filter((m) => m.done).length}/{activeCourse.modules.length})
                    </h4>
                    <div className="space-y-2">
                      {activeCourse.modules.map((mod, idx) => {
                        const isCurrent = idx === activeModuleIdx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveModuleIdx(idx)}
                            className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                              isCurrent
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <input
                                type="checkbox"
                                checked={mod.done}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleModuleCompletion(activeCourse.id, idx);
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="truncate">{mod.title}</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 shrink-0">
                              30m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SÍLABO Y CRONOGRAMA */}
              {workspaceTab === 'syllabus' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/50">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Planificador Académico Inteligente
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Genera una rutina personalizada de 4 semanas adaptada a los módulos de {activeCourse.title}.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateRoutine}
                      disabled={aiRoutineLoading}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {aiRoutineLoading ? 'Generando Rutina...' : 'Generar Rutina con IA'}
                    </button>
                  </div>

                  {aiRoutineHtml && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 text-xs leading-relaxed">
                      <FormattedMessage text={aiRoutineHtml} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCourse.modules.map((mod, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          Semana {idx + 1} · Unidad Oficial
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 mb-1">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Teoría rigurosa, demostraciones fundamentales y problemas tipo examen parcial y final comentados paso a paso.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MATERIALES DEL CURSO */}
              {workspaceTab === 'materials' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCourse.modules.map((mod, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                            Guía Teórico-Práctica: {mod.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Documento HTML Offline · Ejercicios Resueltos
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          downloadOfflineClassPackage(
                            `Separata - ${mod.title}`,
                            activeCourse.instructor,
                            activeCourse.category,
                            `Guía oficial de estudio para ${mod.title}`,
                            studentName
                          );
                          showToast(`Separata de "${mod.title}" descargada`, 'success');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      >
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: PRÁCTICAS Y ENTREGAS */}
              {workspaceTab === 'assignments' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase text-amber-800 dark:text-amber-300">
                        Evaluación Práctica del Curso
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Práctica Calificada: Aplicación de {activeCourse.modules[activeModuleIdx]?.title}
                      </h4>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${
                        assignmentStatus === 'graded'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                      }`}
                    >
                      {assignmentStatus === 'graded' ? 'CALIFICADO: 19/20' : 'PENDIENTE DE ENTREGA'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Desarrollo analítico / código / demostración:
                    </label>
                    <textarea
                      rows={4}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Escribe aquí tu planteamiento matemático, código o resolución paso a paso..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-500 cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>
                        {attachedFileName ? `Archivo: ${attachedFileName}` : 'Adjuntar PDF / Imagen / Script'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAttachedFileName(file.name);
                        }}
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAskAssignmentHint}
                        disabled={aiFeedbackLoading}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4" />
                        {aiFeedbackLoading ? 'Analizando...' : 'Pedir Pista / Revisión IA'}
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Entregar Práctica
                      </button>
                    </div>
                  </div>

                  {aiFeedbackText && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
                      <FormattedMessage text={aiFeedbackText} />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AVISOS Y DUDAS */}
              {workspaceTab === 'announcements' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50">
                    <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      AVISO OFICIAL DEL INSTRUCTOR · {activeCourse.instructor}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      Bienvenidos al curso. Recuerden descargar las separatas offline de cada módulo y utilizar la pestaña 6 (Asesor IA del Curso) para practicar demostraciones antes del examen parcial.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={forumInput}
                      onChange={(e) => setForumInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostCourseQuestion()}
                      placeholder="Publica una duda académica sobre este módulo..."
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handlePostCourseQuestion}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Publicar Duda
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(activeCourse.comments || []).map((post, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
                      >
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {post.author}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{post.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: ASESOR IA DEL CURSO */}
              {workspaceTab === 'ai' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Modo Pedagógico:
                      </span>
                      {[
                        { id: 'rigorous', label: 'Demostración Rigurosa' },
                        { id: 'intuitive', label: 'Intuitivo con Ejemplos' },
                        { id: 'exam', label: 'Entrenamiento Examen' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setAiStyle(mode.id as typeof aiStyle)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            aiStyle === mode.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSpeakLastAiMessage}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> Escuchar Voz
                      </button>
                      <button
                        onClick={handleSaveAiToNotes}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Guardar en Apuntes
                      </button>
                    </div>
                  </div>

                  {/* Quick Prompt Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      `Explícame paso a paso el módulo "${activeCourse.modules[activeModuleIdx]?.title}"`,
                      `Dame 2 problemas resueltos tipo examen parcial de "${activeCourse.modules[activeModuleIdx]?.title}"`,
                      `¿Cuáles son los errores más comunes en "${activeCourse.title}"?`,
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendCourseAiMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium transition cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Chat Window */}
                  <div className="h-72 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    {(courseAiMessages[activeCourse.id] || []).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xs'
                          }`}
                        >
                          <FormattedMessage text={msg.text} />
                        </div>
                      </div>
                    ))}
                    {courseAiLoading && (
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono animate-pulse">
                        El Asesor IA del curso está redactando la demostración...
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={courseAiInput}
                      onChange={(e) => setCourseAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCourseAiMessage()}
                      placeholder={`Pregunta cualquier duda sobre ${activeCourse.title}...`}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleSendCourseAiMessage()}
                      disabled={courseAiLoading}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> Consultar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ============================================================================
 * NOTES VIEW (Mis Apuntes, Comunidad & Materiales de Asesores)
 * ========================================================================== */

interface NotesViewProps {
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
  communityNotes: CommunityNoteItem[];
  setCommunityNotes: React.Dispatch<React.SetStateAction<CommunityNoteItem[]>>;
  tutorMaterials: TutorMaterialItem[];
  tutors: TutorProfile[];
  currentUserName: string;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  setNotes,
  communityNotes,
  setCommunityNotes,
  tutorMaterials,
  tutors,
  currentUserName,
  showToast,
}) => {
  const [subTab, setSubTab] = useState<'my-notes' | 'community' | 'materials'>('my-notes');
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || 'note-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [previewMaterial, setPreviewMaterial] = useState<TutorMaterialItem | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateActiveNote = (field: keyof NoteItem, value: string) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote.id ? { ...n, [field]: value } : n))
    );
  };

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title: 'Nuevo Apunte de Clase',
      category: 'Matemáticas y Ciencias',
      updatedAt: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body:
        '# Nuevo Apunte de Clase\n\n## Conceptos Clave\n- Idea principal 1\n- Fórmula o teorema:\n\n## Ejemplo Resuelto\n1. Paso 1\n2. Paso 2',
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    showToast('Nuevo cuaderno de apuntes creado', 'success');
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      showToast('Debes conservar al menos un apunte en tu cuaderno', 'warning');
      return;
    }
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id && remaining[0]) {
      setActiveNoteId(remaining[0].id);
    }
    showToast('Apunte eliminado', 'info');
  };

  const insertTemplate = (type: 'formula' | 'exam' | 'cornell') => {
    if (!activeNote) return;
    const snippets: Record<typeof type, string> = {
      formula: `\n\n### Bloque de Fórmula Destacada\n\`\`\`\n∫ u dv = u·v - ∫ v du\nΔG = ΔH - T·ΔS\n\`\`\`\n`,
      exam: `\n\n### Ficha de Repaso pre-Examen\n- **Tema:** ${activeNote.title}\n- **Teorema clave:** \n- **Error frecuente a evitar:** \n`,
      cornell: `\n\n### Método Cornell\n- **Preguntas Clave (Izquierda):** ¿Cómo se demuestra este principio?\n- **Notas de Clase (Derecha):** Desarrollo formal y condiciones de aplicación.\n- **Resumen Final (Pie):** Síntesis en 2 líneas.\n`,
    };
    handleUpdateActiveNote('body', activeNote.body + snippets[type]);
    showToast('Plantilla insertada en el apunte', 'success');
  };

  const handleAiNoteAction = async (mode: 'enhance' | 'quiz') => {
    if (!activeNote || aiProcessing) return;
    setAiProcessing(true);
    const matchedTutor =
      tutors.find((t) => t.category === activeNote.category) || tutors[0];
    const prompt =
      mode === 'enhance'
        ? `Resume y estructura profesionalmente este apunte universitario agregando puntos clave y fórmulas esenciales:\n\n${activeNote.body}`
        : `Genera un cuestionario de autoevaluación de 3 preguntas tipo examen con su solucionario al final basado en este apunte:\n\n${activeNote.body}`;

    const res = await consultAcademicAdvisor({
      question: prompt,
      category: activeNote.category,
      advisorName: matchedTutor.name,
      tags: matchedTutor.tags,
    });
    const header =
      mode === 'enhance'
        ? `\n\n---\n### Síntesis Académica Generada por IA\n`
        : `\n\n---\n### Autoevaluación Generada por IA\n`;

    handleUpdateActiveNote('body', activeNote.body + header + res.reply);
    setAiProcessing(false);
    showToast(
      mode === 'enhance'
        ? 'Resumen estructurado añadido al apunte'
        : 'Cuestionario añadido al final del apunte',
      'success'
    );
  };

  const handleDownloadMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Apunte descargado en formato Markdown (.md)', 'success');
  };

  const handleShareToCommunity = () => {
    if (!activeNote) return;
    const newComm: CommunityNoteItem = {
      id: 'comm-' + Date.now(),
      title: activeNote.title,
      author: `${currentUserName} · Comunidad Cloud`,
      category: activeNote.category,
      likes: 1,
      body: activeNote.body,
    };
    setCommunityNotes((prev) => [newComm, ...prev]);
    showToast('¡Apunte compartido con la Comunidad (+15 EduPoints)!', 'success');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Cuaderno de Apuntes Inteligente & Biblioteca Colaborativa
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Toma apuntes con plantillas Cornell, resúmelos con IA o clona resúmenes de la comunidad.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'my-notes', label: `Mis Apuntes (${notes.length})` },
            { id: 'community', label: `Comunidad (${communityNotes.length})` },
            { id: 'materials', label: `Materiales de Asesores (${tutorMaterials.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                subTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: MIS APUNTES */}
      {subTab === 'my-notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar list */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar apunte..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleCreateNote}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                title="Nuevo apunte"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                    activeNote?.id === n.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                      {n.category} · {n.updatedAt}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {n.body.replace(/[#*`]/g, '')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(n.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                    title="Eliminar apunte"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Note Editor */}
          {activeNote && (
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-[600px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote('title', e.target.value)}
                    className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none flex-1"
                  />
                  <select
                    value={activeNote.category}
                    onChange={(e) =>
                      handleUpdateActiveNote('category', e.target.value as AcademicCategory)
                    }
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="Matemáticas y Ciencias">Matemáticas y Ciencias</option>
                    <option value="Programación y Datos">Programación y Datos</option>
                    <option value="Humanidades y Tesis">Humanidades y Tesis</option>
                    <option value="Negocios y Finanzas">Negocios y Finanzas</option>
                    <option value="Ingeniería">Ingeniería</option>
                    <option value="Idiomas">Idiomas</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> .MD
                  </button>
                  <button
                    onClick={handleShareToCommunity}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Publicar
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => insertTemplate('formula')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    + Fórmula
                  </button>
                  <button
                    onClick={() => insertTemplate('exam')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    + Ficha Examen
                  </button>
                  <button
                    onClick={() => insertTemplate('cornell')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    + Plantilla Cornell
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAiNoteAction('enhance')}
                    disabled={aiProcessing}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiProcessing ? 'Procesando...' : 'Resumir con IA'}
                  </button>
                  <button
                    onClick={() => handleAiNoteAction('quiz')}
                    disabled={aiProcessing}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generar Quiz IA
                  </button>
                </div>
              </div>

              <textarea
                value={activeNote.body}
                onChange={(e) => handleUpdateActiveNote('body', e.target.value)}
                className="flex-1 w-full pt-4 bg-transparent font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none resize-none"
                placeholder="Escribe tus apuntes aquí..."
              />
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: APUNTES DE LA COMUNIDAD */}
      {subTab === 'community' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityNotes.map((cn) => (
            <div
              key={cn.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {cn.category}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {cn.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Por <strong className="text-slate-700 dark:text-slate-200">{cn.author}</strong>
                </p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-4 mb-4">
                  {cn.body}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setCommunityNotes((prev) =>
                      prev.map((item) =>
                        item.id === cn.id ? { ...item, likes: item.likes + 1 } : item
                      )
                    );
                    showToast('¡Te gustó este apunte de la comunidad!', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" /> {cn.likes}
                </button>
                <button
                  onClick={() => {
                    const cloned: NoteItem = {
                      id: 'note-' + Date.now(),
                      title: `[Comunidad] ${cn.title}`,
                      category: cn.category,
                      updatedAt: 'Clonado hoy',
                      body: cn.body,
                    };
                    setNotes((prev) => [cloned, ...prev]);
                    setSubTab('my-notes');
                    setActiveNoteId(cloned.id);
                    showToast('Apunte guardado en tu cuaderno personal', 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Clonar a Mis Apuntes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: MATERIALES DE ASESORES */}
      {subTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                    {mat.category} · {mat.format}
                  </span>
                  <span className="text-slate-400">{mat.access}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {mat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Autor: <strong className="text-slate-700 dark:text-slate-200">{mat.author}</strong> · {mat.date}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-4 font-mono">
                  {mat.content}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPreviewMaterial(mat)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Vista Previa
                </button>
                <button
                  onClick={() => {
                    const cloned: NoteItem = {
                      id: 'note-' + Date.now(),
                      title: `[Material] ${mat.title}`,
                      category: mat.category,
                      updatedAt: 'Descargado hoy',
                      body: `# ${mat.title}\n**Autor:** ${mat.author}\n\n${mat.content}`,
                    };
                    setNotes((prev) => [cloned, ...prev]);
                    showToast('Material guardado en Mis Apuntes', 'success');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Material Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {previewMaterial.category} · {previewMaterial.format}
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {previewMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto mb-4">
              {previewMaterial.content}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ============================================================================
 * CERTIFICATE MODAL (High-Resolution HTML5 Canvas PNG Export)
 * ========================================================================== */

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  instructorName: string;
  defaultStudentName: string;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  instructorName,
  defaultStudentName,
  showToast,
}) => {
  const [studentName, setStudentName] = useState<string>(defaultStudentName || 'Estudiante EduNexus');

  if (!isOpen) return null;

  const verifyCode = `EDUNEXUS-${Math.abs(courseTitle.length * 137 + studentName.length * 91)}-VERIFIED`;

  const handleDownloadCertificatePng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 820);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 40, 1120, 740);

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, 1080, 700);
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 2;
    ctx.strokeRect(72, 72, 1056, 676);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EDUNEXUS CLOUD · ACADEMIA UNIVERSITARIA VERIFICADA', 600, 150);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CERTIFICADO DE EXCELENCIA ACADÉMICA', 600, 220);

    ctx.fillStyle = '#475569';
    ctx.font = '20px "DM Sans", sans-serif';
    ctx.fillText('Se otorga el presente certificado oficial a:', 600, 290);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(studentName.toUpperCase(), 600, 360);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 385);
    ctx.lineTo(850, 385);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '20px "DM Sans", sans-serif';
    ctx.fillText('Por haber completado satisfactorio el programa académico:', 600, 445);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(courseTitle, 600, 500);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "DM Sans", sans-serif';
    ctx.fillText(instructorName, 360, 640);
    ctx.fillText('Dirección Académica EduNexus', 840, 640);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.fillText('Instructor Titular Verificado', 360, 668);
    ctx.fillText(`ID: ${verifyCode}`, 840, 668);

    const link = document.createElement('a');
    link.download = `certificado_${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Certificado oficial descargado en alta resolución (.PNG)', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Certificado Académico Verificado
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 border-2 border-indigo-500/70 text-center space-y-3 mb-5 shadow-inner">
          <p className="text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
            EduNexus Cloud · Certificación Académica
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            CERTIFICADO DE FINALIZACIÓN
          </h2>
          <p className="text-xs text-slate-500">Otorgado oficialmente a:</p>
          <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-200 dark:border-indigo-800 pb-2 max-w-md mx-auto">
            {studentName}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Por completar con excelencia académica el curso o módulo:
          </p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {courseTitle}
          </p>
          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-200 dark:border-slate-800">
            <span>Instructor: {instructorName}</span>
            <span>Código: {verifyCode}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Personalizar Nombre en el Certificado:
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleDownloadCertificatePng}
            className="w-full sm:w-auto mt-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Descargar Certificado (.PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
