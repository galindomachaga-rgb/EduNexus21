import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Download,
  Award,
  Star,
  Trash2,
  Upload,
  Plus,
  DollarSign,
  FileText,
  CheckCircle2,
  Send,
  Heart,
  MessageCircle,
  Users,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import {
  BookingItem,
  TutorProfile,
  TutorMaterialItem,
  CourseItem,
  UserAccount,
  SocialPost,
  DirectMessage,
} from '../data/seedData';
import {
  AcademicCategory,
  CurrencyCode,
  formatCurrency,
  generateIcsCalendarContent,
} from '../utils/academicLogic';
import { downloadOfflineClassPackage } from '../utils/aiClient';

/* ============================================================================
 * BOOKINGS VIEW (Mis Clases Agendadas + Calendario Semanal .ICS + Calificar)
 * ========================================================================== */

interface BookingsViewProps {
  bookings: BookingItem[];
  setBookings: React.Dispatch<React.SetStateAction<BookingItem[]>>;
  tutors: TutorProfile[];
  setTutors: React.Dispatch<React.SetStateAction<TutorProfile[]>>;
  currency: CurrencyCode;
  studentName: string;
  onEnterClassroomWithTutor: (tutorId: string) => void;
  onOpenCertificate: (title: string, instructor: string) => void;
  onExploreTutors: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  setBookings,
  tutors,
  setTutors,
  currency,
  studentName,
  onEnterClassroomWithTutor,
  onOpenCertificate,
  onExploreTutors,
  showToast,
}) => {
  const [ratingBooking, setRatingBooking] = useState<BookingItem | null>(null);
  const [ratedIds, setRatedIds] = useState<Record<string, boolean>>({});
  const [stars, setStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  const handleCancelBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    showToast('Reserva cancelada y horario liberado', 'info');
  };

  const handleExportIcs = () => {
    const icsContent = generateIcsCalendarContent(bookings);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edunexus_calendario_clases.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Calendario (.ICS) exportado para Google Calendar / Outlook', 'success');
  };

  const handleSubmitRating = () => {
    if (!ratingBooking) return;
    setRatedIds((prev) => ({ ...prev, [ratingBooking.id]: true }));
    setTutors((prev) =>
      prev.map((t) => {
        if (t.id !== ratingBooking.tutorId && t.name !== ratingBooking.tutorName) return t;
        const newReviews = t.reviews + 1;
        const newRating = Number(
          ((t.rating * t.reviews + stars) / newReviews).toFixed(2)
        );
        return { ...t, rating: Math.min(5, newRating), reviews: newReviews };
      })
    );
    setRatingBooking(null);
    setReviewComment('');
    showToast(`¡Gracias! Calificación de ${stars}★ registrada para ${ratingBooking.tutorName}`, 'success');
  };

  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const timeSlots = ['09:00 AM', '11:00 AM', '04:00 PM', '06:00 PM', '08:00 PM'];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Mis Asesorías Agendadas & Calendario Académico
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Ingresa a tu sesión en vivo, descarga resúmenes offline (.HTML) o sincroniza tu agenda en Google Calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportIcs}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-indigo-600" /> Exportar Agenda (.ICS)
          </button>
          <button
            onClick={onExploreTutors}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
          >
            + Agendar Nueva Asesoría
          </button>
        </div>
      </div>

      {/* Bookings Cards */}
      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            No tienes asesorías programadas en este momento
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Explora nuestro directorio de asesores verificados y agenda tu primera sesión personalizada.
          </p>
          <button
            onClick={onExploreTutors}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
          >
            Ver Directorio de Asesores
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((b) => {
            const matchedTutor = tutors.find(
              (t) => t.id === b.tutorId || t.name === b.tutorName
            );
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl ${
                        matchedTutor?.accentColor || 'bg-indigo-700'
                      } text-white font-extrabold flex items-center justify-center text-sm`}
                    >
                      {matchedTutor?.initials || 'ED'}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                        Confirmada · {b.platform}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {b.topic}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Asesor: <strong className="text-slate-700 dark:text-slate-200">{b.tutorName}</strong> ({b.category})
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(b.price, currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {b.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> {b.time}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onEnterClassroomWithTutor(b.tutorId)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" /> Entrar al Aula
                    </button>
                    <button
                      onClick={() => {
                        downloadOfflineClassPackage(
                          b.topic,
                          b.tutorName,
                          b.category,
                          `Sesión personalizada programada para el ${b.date} a las ${b.time} vía ${b.platform}.`,
                          studentName
                        );
                        showToast('Resumen de clase offline (.HTML) descargado', 'success');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Offline
                    </button>
                    <button
                      onClick={() => onOpenCertificate(b.topic, b.tutorName)}
                      className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" /> Certificado
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!ratedIds[b.id] ? (
                      <button
                        onClick={() => {
                          setRatingBooking(b);
                          setStars(5);
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" /> Calificar
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2">
                        ★ Calificada
                      </span>
                    )}
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      title="Cancelar asesoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Visual Schedule Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Cronograma Visual de la Semana
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Zona Horaria: GMT-5 (Lima / Bogotá / Quito)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-2.5 px-3">Hora</th>
                {weekDays.map((d) => (
                  <th key={d} className="py-2.5 px-3">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
              {timeSlots.map((slot, sIdx) => (
                <tr key={slot}>
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">{slot}</td>
                  {weekDays.map((day, dIdx) => {
                    const matchedBooking =
                      bookings[(sIdx + dIdx) % Math.max(1, bookings.length)] &&
                      sIdx === dIdx % 3 &&
                      dIdx < bookings.length
                        ? bookings[dIdx]
                        : null;
                    return (
                      <td key={day} className="py-2 px-2">
                        {matchedBooking ? (
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                            <p className="font-bold text-[11px] text-indigo-900 dark:text-indigo-200 truncate">
                              {matchedBooking.topic}
                            </p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                              {matchedBooking.tutorName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 dark:text-slate-700 font-mono">
                            Disponible
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Tutor Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
              Calificar Sesión con {ratingBooking.tutorName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tema: {ratingBooking.topic}</p>
            <div className="flex items-center justify-center gap-2 my-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  className={`p-2 rounded-xl text-2xl transition cursor-pointer ${
                    n <= stars ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Comparte qué te pareció la claridad y metodología del asesor..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRatingBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitRating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Enviar Calificación
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ============================================================================
 * TUTOR PORTAL VIEW (Portal para Asesores: Materiales, Horarios, Cursos)
 * ========================================================================== */

interface TutorPortalViewProps {
  tutors: TutorProfile[];
  tutorMaterials: TutorMaterialItem[];
  setTutorMaterials: React.Dispatch<React.SetStateAction<TutorMaterialItem[]>>;
  setCourses: React.Dispatch<React.SetStateAction<CourseItem[]>>;
  currency: CurrencyCode;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const TutorPortalView: React.FC<TutorPortalViewProps> = ({
  tutors,
  tutorMaterials,
  setTutorMaterials,
  setCourses,
  currency,
  showToast,
}) => {
  const [matTitle, setMatTitle] = useState<string>('');
  const [matCategory, setMatCategory] = useState<AcademicCategory>('Matemáticas y Ciencias');
  const [matTutor, setMatTutor] = useState<string>(tutors[0]?.name || 'Dr. Alejandro Vargas');
  const [matPreview, setMatPreview] = useState<string>('');
  const [matFileName, setMatFileName] = useState<string>('');

  // Course creation state
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [courseCategory, setCourseCategory] = useState<AcademicCategory>('Matemáticas y Ciencias');
  const [coursePrice, setCoursePrice] = useState<number>(35);
  const [courseModulesRaw, setCourseModulesRaw] = useState<string>(
    'Módulo 1: Fundamentos y Definiciones\nMódulo 2: Teoremas Principales\nMódulo 3: Problemas Tipo Examen'
  );

  // Availability matrix
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    'Lun-09:00': true,
    'Lun-16:00': true,
    'Mar-11:00': true,
    'Mie-18:00': true,
    'Jue-16:00': true,
    'Vie-10:00': true,
    'Sab-09:00': true,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMatFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (content && !matPreview) {
        setMatPreview(content.slice(0, 1500));
      }
    };
    reader.readAsText(file);
  };

  const handlePublishMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) {
      showToast('Ingresa un título para el material académico', 'warning');
      return;
    }
    const newMat: TutorMaterialItem = {
      id: 'tm-' + Date.now(),
      title: matTitle.trim(),
      author: matTutor,
      category: matCategory,
      format: 'Guía & Solucionario',
      access: 'Descarga Libre',
      fileName: matFileName || 'separata_universitaria.pdf',
      downloads: 1,
      date: 'Publicado hoy',
      content:
        matPreview.trim() ||
        `=========================================\n${matTitle.toUpperCase()}\nAutor: ${matTutor}\n=========================================\n\n1. Fórmulas Fundamentales\n2. Ejercicios Resueltos Paso a Paso`,
    };
    setTutorMaterials((prev) => [newMat, ...prev]);
    setMatTitle('');
    setMatPreview('');
    setMatFileName('');
    showToast('Material académico publicado en la biblioteca de estudiantes', 'success');
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      showToast('Escribe el título del nuevo curso modular', 'warning');
      return;
    }
    const modules = courseModulesRaw
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)
      .map((title) => ({ title, done: false }));

    const newCourse: CourseItem = {
      id: 'course-' + Date.now(),
      title: courseTitle.trim(),
      instructor: matTutor,
      category: courseCategory,
      price: Number(coursePrice) || 35,
      students: 1,
      modules: modules.length > 0 ? modules : [{ title: 'Módulo 1: Introducción', done: false }],
      comments: [],
    };
    setCourses((prev) => [newCourse, ...prev]);
    setCourseTitle('');
    showToast('¡Nuevo curso publicado en la pestaña Academia & Cursos!', 'success');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & KPI Metrics */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
              Panel de Gestión Docente · SUNEDU Verificado
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Portal del Asesor Académico
            </h1>
          </div>
          <button
            onClick={() =>
              showToast('Solicitud de transferencia enviada a tu cuenta bancaria asociada', 'success')
            }
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer self-start"
          >
            <DollarSign className="w-4 h-4" /> Retirar Ingresos Disponibles
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span className="text-xs text-slate-400">Ingresos del Mes</span>
            <p className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(680, currency)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span className="text-xs text-slate-400">Materiales Publicados</span>
            <p className="text-2xl font-mono font-extrabold text-white mt-1">
              {tutorMaterials.length} guías
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span className="text-xs text-slate-400">Horas Dictadas</span>
            <p className="text-2xl font-mono font-extrabold text-indigo-400 mt-1">42.5 h</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <span className="text-xs text-slate-400">Calificación Promedio</span>
            <p className="text-2xl font-mono font-extrabold text-amber-400 mt-1">4.96 ★</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Material Form */}
        <form
          onSubmit={handlePublishMaterial}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" /> Subir Separata, Solucionario o Guía de Estudio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Título del Material
              </label>
              <input
                type="text"
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                placeholder="Ej. Solucionario Examen Parcial Cálculo III"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Categoría Académica
              </label>
              <select
                value={matCategory}
                onChange={(e) => setMatCategory(e.target.value as AcademicCategory)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Matemáticas y Ciencias">Matemáticas y Ciencias</option>
                <option value="Programación y Datos">Programación y Datos</option>
                <option value="Humanidades y Tesis">Humanidades y Tesis</option>
                <option value="Negocios y Finanzas">Negocios y Finanzas</option>
                <option value="Ingeniería">Ingeniería</option>
                <option value="Idiomas">Idiomas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Asesor Autor
            </label>
            <select
              value={matTutor}
              onChange={(e) => setMatTutor(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              {tutors.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Resumen / Contenido de Vista Previa
            </label>
            <textarea
              rows={3}
              value={matPreview}
              onChange={(e) => setMatPreview(e.target.value)}
              placeholder="Pega aquí las fórmulas, teoremas o ejercicios resueltos del documento..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{matFileName || 'Adjuntar archivo local (.txt, .md, .pdf)'}</span>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
            >
              Publicar Material
            </button>
          </div>
        </form>

        {/* Create New Modular Course Form */}
        <form
          onSubmit={handleCreateCourse}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> Publicar Nuevo Curso Modular Asíncrono
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Título del Curso
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ej. Álgebra Lineal Aplicada a Machine Learning"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Área
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value as AcademicCategory)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Matemáticas y Ciencias">Matemáticas</option>
                  <option value="Programación y Datos">Programación</option>
                  <option value="Humanidades y Tesis">Tesis</option>
                  <option value="Negocios y Finanzas">Negocios</option>
                  <option value="Ingeniería">Ingeniería</option>
                  <option value="Idiomas">Idiomas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Precio (USD)
                </label>
                <input
                  type="number"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Módulos del Curso (uno por línea)
            </label>
            <textarea
              rows={4}
              value={courseModulesRaw}
              onChange={(e) => setCourseModulesRaw(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              Crear y Publicar Curso en Academia
            </button>
          </div>
        </form>
      </div>

      {/* Availability Toggle Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Configuración de Bloques Horarios Disponibles
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Haz clic en cualquier bloque para habilitar o pausar tu disponibilidad en el directorio público.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Lun-09:00',
            'Lun-16:00',
            'Mar-11:00',
            'Mar-19:00',
            'Mie-15:00',
            'Mie-18:00',
            'Jue-16:00',
            'Vie-10:00',
            'Vie-17:00',
            'Sab-09:00',
          ].map((slot) => {
            const active = !!availability[slot];
            return (
              <button
                key={slot}
                onClick={() => {
                  setAvailability((prev) => ({ ...prev, [slot]: !prev[slot] }));
                  showToast(`Horario ${slot} ${!active ? 'habilitado' : 'pausado'}`, 'info');
                }}
                className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {slot}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
 * REALTIME SOCIAL VIEW (Comunidad Live, Multi-Cuenta, Feed & Chat 1-a-1)
 * ========================================================================== */

interface RealtimeSocialViewProps {
  currentUser: UserAccount | null;
  savedAccounts: UserAccount[];
  onSwitchAccount: (acc: UserAccount) => void;
  onOpenAuthModal: () => void;
  socialPosts: SocialPost[];
  setSocialPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
  directMessages: DirectMessage[];
  setDirectMessages: React.Dispatch<React.SetStateAction<DirectMessage[]>>;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const RealtimeSocialView: React.FC<RealtimeSocialViewProps> = ({
  currentUser,
  savedAccounts,
  onSwitchAccount,
  onOpenAuthModal,
  socialPosts,
  setSocialPosts,
  directMessages,
  setDirectMessages,
  showToast,
}) => {
  const [postContent, setPostContent] = useState<string>('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [selectedDmTarget, setSelectedDmTarget] = useState<string>('ALL');
  const [dmInput, setDmInput] = useState<string>('');
  const [wsEvents, setWsEvents] = useState<string[]>([
    '[WS-SYNC] Canal BroadcastChannel("edunexus_realtime_v2") activo',
    '[PRESENCE] Cuentas verificadas en línea',
  ]);

  const activeUser: UserAccount = currentUser || savedAccounts[0];

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('edunexus_realtime_v2');
    channel.onmessage = (ev) => {
      const data = ev.data;
      if (data?.type === 'NEW_POST') {
        setSocialPosts((prev) => [data.payload, ...prev]);
        setWsEvents((prev) => [
          `[POST] Nueva publicación de ${data.payload.author_name}`,
          ...prev.slice(0, 9),
        ]);
      } else if (data?.type === 'NEW_DM') {
        setDirectMessages((prev) => [...prev, data.payload]);
        setWsEvents((prev) => [
          `[DM] Mensaje en tiempo real de ${data.payload.sender_name}`,
          ...prev.slice(0, 9),
        ]);
      }
    };
    return () => channel.close();
  }, [setSocialPosts, setDirectMessages]);

  const broadcastEvent = (type: string, payload: unknown) => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('edunexus_realtime_v2');
      channel.postMessage({ type, payload });
      channel.close();
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    const newPost: SocialPost = {
      id: 'post-' + Date.now(),
      author_id: activeUser.id,
      author_name: activeUser.name,
      author_email: activeUser.email,
      author_role: activeUser.role,
      category: 'Publicación Académica',
      content: postContent.trim(),
      created_at: 'Ahora mismo',
      likes_user_ids: [],
      comments: [],
    };
    setSocialPosts((prev) => [newPost, ...prev]);
    broadcastEvent('NEW_POST', newPost);
    setWsEvents((prev) => [
      `[POST_CREATE] ${activeUser.name} publicó en el muro académico`,
      ...prev.slice(0, 9),
    ]);
    setPostContent('');
    showToast('Publicación compartida en tiempo real', 'success');
  };

  const handleToggleLike = (postId: string) => {
    setSocialPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes_user_ids.includes(activeUser.id);
        const updatedLikes = hasLiked
          ? p.likes_user_ids.filter((id) => id !== activeUser.id)
          : [...p.likes_user_ids, activeUser.id];
        return { ...p, likes_user_ids: updatedLikes };
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    setSocialPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: 'cm-' + Date.now(),
              author_id: activeUser.id,
              author_name: activeUser.name,
              author_role: activeUser.role,
              text,
              time: 'Ahora',
            },
          ],
        };
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim()) return;
    const newMsg: DirectMessage = {
      id: 'dm-' + Date.now(),
      sender_id: activeUser.id,
      sender_name: activeUser.name,
      sender_email: activeUser.email,
      recipient_email: selectedDmTarget,
      message: dmInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setDirectMessages((prev) => [...prev, newMsg]);
    broadcastEvent('NEW_DM', newMsg);
    setDmInput('');
  };

  const visibleMessages = directMessages.filter(
    (m) =>
      selectedDmTarget === 'ALL'
        ? true
        : (m.sender_email === activeUser.email && m.recipient_email === selectedDmTarget) ||
          (m.sender_email === selectedDmTarget && m.recipient_email === activeUser.email)
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Account Directory & Realtime Log */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Cuentas Activas (Cambio 1-Clic)
              </h3>
              <button
                onClick={onOpenAuthModal}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                + Cuenta
              </button>
            </div>
            <div className="space-y-2">
              {savedAccounts.map((acc) => {
                const isCurrent = acc.id === activeUser.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => onSwitchAccount(acc)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {acc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.role}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        ACTIVO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 border border-slate-800 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2">
              <Radio className="w-3.5 h-3.5" /> Monitor de Eventos Realtime
            </div>
            {wsEvents.map((ev, i) => (
              <p key={i} className="truncate text-slate-400">
                {ev}
              </p>
            ))}
          </div>
        </div>

        {/* Center Column: Academic Social Feed */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleCreatePost}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {activeUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Publicando como {activeUser.name}
                </p>
                <p className="text-[11px] text-slate-500">{activeUser.uni}</p>
              </div>
            </div>
            <textarea
              rows={2}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Comparte un recurso, problema resuelto o anuncio académico..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
              >
                Publicar en Comunidad Live
              </button>
            </div>
          </form>

          {socialPosts.map((post) => {
            const isLiked = post.likes_user_ids.includes(activeUser.id);
            return (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {post.author_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {post.author_name}
                        </h4>
                        {post.author_role === 'Asesor Verificado' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {post.category} · {post.created_at}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      isLiked
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" /> {post.likes_user_ids.length} Me gusta
                  </button>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments.length} Comentarios
                  </span>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                          {c.author_name}:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    placeholder="Comentar..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Enviar
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right Column: Direct Messages (1-on-1 & Global Chat) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col h-[580px]">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-indigo-600" /> Mensajería Directa & Sala Global
            </h3>
            <select
              value={selectedDmTarget}
              onChange={(e) => setSelectedDmTarget(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Canal General de la Comunidad (Todos)</option>
              {savedAccounts
                .filter((a) => a.email !== activeUser.email)
                .map((a) => (
                  <option key={a.id} value={a.email}>
                    Chat 1-a-1 con {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {visibleMessages.map((m) => {
              const isMe = m.sender_id === activeUser.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                    {m.sender_name} · {m.time}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendDm} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder="Escribe un mensaje directo..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
