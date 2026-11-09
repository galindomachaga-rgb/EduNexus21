import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Calendar,
  Video,
  Star,
  ShieldCheck,
  Wallet,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  UserCheck,
  BookOpen,
  GraduationCap,
  Radio,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ViewId,
  TutorProfile,
  CourseItem,
  NoteItem,
  CommunityNoteItem,
  TutorMaterialItem,
  BookingItem,
  FlashcardItem,
  QnaThread,
  GroupStudyRoom,
  UserAccount,
  SocialPost,
  DirectMessage,
  NotificationItem,
  DEFAULT_TUTORS,
  DEFAULT_COURSES,
  DEFAULT_NOTES,
  DEFAULT_COMMUNITY_NOTES,
  DEFAULT_TUTOR_MATERIALS,
  DEFAULT_BOOKINGS,
  DEFAULT_FLASHCARDS,
  DEFAULT_QNA_THREADS,
  DEFAULT_GROUP_ROOMS,
  DEFAULT_SAVED_ACCOUNTS,
  DEFAULT_SOCIAL_POSTS,
  DEFAULT_DIRECT_MESSAGES,
} from './data/seedData';
import {
  AcademicCategory,
  CurrencyCode,
  formatCurrency,
} from './utils/academicLogic';
import { ClassroomView } from './components/ClassroomView';
import { StudioView } from './components/StudioView';
import {
  CoursesView,
  NotesView,
  CertificateModal,
} from './components/NotesAndCoursesView';
import {
  BookingsView,
  TutorPortalView,
  RealtimeSocialView,
} from './components/PortalAndSocialView';
import {
  GoogleAuthModal,
  TutorVerificationModal,
  BookingModal,
  BecomeTutorModal,
  WalletModal,
  GeminiModal,
  NotificationsModal,
  SupportModal,
} from './components/GlobalModals';

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Navigation & Theme
  const [activeView, setActiveView] = useState<ViewId>('tutors');
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadState('edunexus_dark', false)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(() =>
    loadState('edunexus_currency', 'USD')
  );

  // Core Data States
  const [tutors, setTutors] = useState<TutorProfile[]>(() =>
    loadState('edunexus_tutors_v2', DEFAULT_TUTORS)
  );
  const [courses, setCourses] = useState<CourseItem[]>(() =>
    loadState('edunexus_courses_v2', DEFAULT_COURSES)
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    loadState('edunexus_notes_v2', DEFAULT_NOTES)
  );
  const [communityNotes, setCommunityNotes] = useState<CommunityNoteItem[]>(() =>
    loadState('edunexus_comm_notes_v2', DEFAULT_COMMUNITY_NOTES)
  );
  const [tutorMaterials, setTutorMaterials] = useState<TutorMaterialItem[]>(() =>
    loadState('edunexus_materials_v2', DEFAULT_TUTOR_MATERIALS)
  );
  const [bookings, setBookings] = useState<BookingItem[]>(() =>
    loadState('edunexus_bookings_v2', DEFAULT_BOOKINGS)
  );
  const [flashcardDecks, setFlashcardDecks] = useState<
    Record<string, FlashcardItem[]>
  >(() => loadState('edunexus_flashcards_v2', DEFAULT_FLASHCARDS));
  const [qnaThreads, setQnaThreads] = useState<QnaThread[]>(() =>
    loadState('edunexus_qna_v2', DEFAULT_QNA_THREADS)
  );
  const [groupRooms, setGroupRooms] = useState<GroupStudyRoom[]>(() =>
    loadState('edunexus_rooms_v2', DEFAULT_GROUP_ROOMS)
  );
  const [weeklyHours, setWeeklyHours] = useState<number[]>(() =>
    loadState('edunexus_weekly_hours_v2', [2.5, 3.0, 2.0, 4.0, 3.5, 4.5, 2.0])
  );

  // Accounts & Social States
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() =>
    loadState('edunexus_accounts_v2', DEFAULT_SAVED_ACCOUNTS)
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadState('edunexus_current_user_v2', DEFAULT_SAVED_ACCOUNTS[0])
  );
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() =>
    loadState('edunexus_social_posts_v2', DEFAULT_SOCIAL_POSTS)
  );
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() =>
    loadState('edunexus_dms_v2', DEFAULT_DIRECT_MESSAGES)
  );

  // Wallet & Loyalty Points
  const [walletBalanceUsd, setWalletBalanceUsd] = useState<number>(() =>
    loadState('edunexus_wallet_usd', 25)
  );
  const [eduPoints, setEduPoints] = useState<number>(() =>
    loadState('edunexus_edupoints', 50)
  );

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Sesión confirmada con Dr. Alejandro Vargas',
      desc: 'Recuerda revisar tus apuntes de Cálculo Vectorial antes de entrar al Aula Virtual.',
      time: 'Hace 15 min',
      unread: true,
    },
    {
      id: 'n-2',
      title: 'Bono de Bienvenida Acreditado',
      desc: 'Tienes 50 EduPoints disponibles en tu tienda de fidelidad académica.',
      time: 'Hace 1 hora',
      unread: true,
    },
  ]);

  // Tutor Directory Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxPriceUsd, setMaxPriceUsd] = useState<number>(40);
  const [onlyOnlineToday, setOnlyOnlineToday] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'reviews'>('rating');

  // Classroom & AI Advisor Active Tutor
  const [classroomTutorId, setClassroomTutorId] = useState<string>(
    DEFAULT_TUTORS[0].id
  );
  const [externalBoardState, setExternalBoardState] = useState<{
    question: string;
    notes: string;
  } | null>(null);

  // Modals Visibility
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState<boolean>(false);
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null);
  const [becomeTutorOpen, setBecomeTutorOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState<boolean>(false);
  const [geminiTutorId, setGeminiTutorId] = useState<string>(DEFAULT_TUTORS[0].id);
  const [notifModalOpen, setNotifModalOpen] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [certModalData, setCertModalData] = useState<{
    open: boolean;
    title: string;
    instructor: string;
  }>({ open: false, title: '', instructor: '' });

  // Toast Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' = 'info'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  };

  // Sync Dark Mode with HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('edunexus_dark', JSON.stringify(darkMode));
  }, [darkMode]);

  // Persist States
  useEffect(() => {
    localStorage.setItem('edunexus_currency', JSON.stringify(currency));
  }, [currency]);
  useEffect(() => {
    localStorage.setItem('edunexus_tutors_v2', JSON.stringify(tutors));
  }, [tutors]);
  useEffect(() => {
    localStorage.setItem('edunexus_courses_v2', JSON.stringify(courses));
  }, [courses]);
  useEffect(() => {
    localStorage.setItem('edunexus_notes_v2', JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('edunexus_comm_notes_v2', JSON.stringify(communityNotes));
  }, [communityNotes]);
  useEffect(() => {
    localStorage.setItem('edunexus_materials_v2', JSON.stringify(tutorMaterials));
  }, [tutorMaterials]);
  useEffect(() => {
    localStorage.setItem('edunexus_bookings_v2', JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem('edunexus_flashcards_v2', JSON.stringify(flashcardDecks));
  }, [flashcardDecks]);
  useEffect(() => {
    localStorage.setItem('edunexus_qna_v2', JSON.stringify(qnaThreads));
  }, [qnaThreads]);
  useEffect(() => {
    localStorage.setItem('edunexus_rooms_v2', JSON.stringify(groupRooms));
  }, [groupRooms]);
  useEffect(() => {
    localStorage.setItem('edunexus_accounts_v2', JSON.stringify(savedAccounts));
  }, [savedAccounts]);
  useEffect(() => {
    localStorage.setItem('edunexus_current_user_v2', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('edunexus_social_posts_v2', JSON.stringify(socialPosts));
  }, [socialPosts]);
  useEffect(() => {
    localStorage.setItem('edunexus_dms_v2', JSON.stringify(directMessages));
  }, [directMessages]);
  useEffect(() => {
    localStorage.setItem('edunexus_wallet_usd', JSON.stringify(walletBalanceUsd));
  }, [walletBalanceUsd]);
  useEffect(() => {
    localStorage.setItem('edunexus_edupoints', JSON.stringify(eduPoints));
  }, [eduPoints]);

  // Filter & Sort Tutors
  const filteredTutors = tutors
    .filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (t.price > maxPriceUsd) return false;
      if (onlyOnlineToday && !t.onlineToday) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = t.name.toLowerCase().includes(q);
        const inCat = t.category.toLowerCase().includes(q);
        const inUni = t.uni.toLowerCase().includes(q);
        const inTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
        return inName || inCat || inUni || inTags;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      return b.rating - a.rating;
    });

  const activeClassroomTutor =
    tutors.find((t) => t.id === classroomTutorId) || tutors[0];

  const handleSaveNoteHelper = (
    title: string,
    category: AcademicCategory,
    body: string
  ) => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title,
      category,
      updatedAt: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body,
    };
    setNotes((prev) => [newNote, ...prev]);
    setEduPoints((prev) => prev + 5);
    showToast('Apunte guardado en tu Cuaderno Inteligente (+5 EduPoints)', 'success');
  };

  const handleConfirmBooking = (
    newBooking: BookingItem,
    paymentMethod: 'yape' | 'card' | 'wallet',
    totalUsd: number
  ) => {
    if (paymentMethod === 'wallet') {
      if (walletBalanceUsd < totalUsd) {
        showToast('Saldo insuficiente en tu Billetera. Recarga o usa Yape/Tarjeta.', 'warning');
        return;
      }
      setWalletBalanceUsd((prev) => Math.max(0, prev - totalUsd));
    }
    setBookings((prev) => [newBooking, ...prev]);
    setEduPoints((prev) => prev + 10);
    setBookingTutor(null);
    setActiveView('bookings');
    showToast('¡Asesoría agendada con éxito (+10 EduPoints)!', 'success');
  };

  const handleOpenTutorPortal = () => {
    if (currentUser?.isVerifiedTutor) {
      setActiveView('tutor-portal');
    } else {
      setVerifyModalOpen(true);
    }
  };

  const handleExportBackupJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      notes,
      bookings,
      courses,
      walletBalanceUsd,
      eduPoints,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edunexus_cloud_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad (.JSON) descargada', 'success');
  };

  const handleImportBackupJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
        if (Array.isArray(parsed.bookings)) setBookings(parsed.bookings);
        if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
        showToast('Copia de seguridad restaurada correctamente', 'success');
        setSupportModalOpen(false);
      } catch {
        showToast('El archivo JSON no tiene un formato válido', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* PRIMARY TOP NAVIGATION BAR (3-Zone Contract: Brand | 5 Primary Views | 1 Account Action) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => setActiveView('tutors')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              EN
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                EduNexus <span className="text-indigo-600 dark:text-indigo-400">Cloud</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Asesorías & Estudio IA
              </span>
            </div>
          </button>

          {/* Zone 2: 5 Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación Principal">
            {[
              { id: 'tutors', label: 'Asesores' },
              { id: 'courses', label: 'Academia & Cursos' },
              { id: 'studio', label: 'Estudio & Práctica' },
              { id: 'classroom', label: 'Aula Virtual' },
              { id: 'notes', label: 'Apuntes' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeView === item.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Single Primary Account / Google Auth CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">
                {currentUser ? currentUser.name : 'Acceder con Google'}
              </span>
            </button>
          </div>
        </div>

        {/* SECONDARY WORKSPACE UTILITY BAR (Secondary Views, AI Advisor, Wallet, Currency, Theme) */}
        <div className="bg-slate-100/80 dark:bg-slate-950/80 border-t border-slate-200/70 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Mobile + Secondary Views Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {/* Mobile visible primary links */}
              <div className="flex md:hidden items-center gap-1 pr-2 border-r border-slate-300 dark:border-slate-700">
                {[
                  { id: 'tutors', label: 'Asesores' },
                  { id: 'courses', label: 'Cursos' },
                  { id: 'studio', label: 'Estudio' },
                  { id: 'classroom', label: 'Aula' },
                  { id: 'notes', label: 'Apuntes' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveView(m.id as ViewId)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer ${
                      activeView === m.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveView('bookings')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'bookings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Mis Clases ({bookings.length})</span>
              </button>

              <button
                onClick={handleOpenTutorPortal}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'tutor-portal'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portal Asesor</span>
              </button>

              <button
                onClick={() => setActiveView('realtime-social')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeView === 'realtime-social'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" />
                <span>Comunidad Live</span>
              </button>
            </div>

            {/* Right Utility Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setGeminiModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Consultar Asesor IA
              </button>

              <button
                onClick={() => setWalletModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-mono font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                title="Billetera Estudiantil & EduPoints"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatCurrency(walletBalanceUsd, currency)}</span>
                <span className="text-indigo-600 dark:text-indigo-400">· {eduPoints} pts</span>
              </button>

              <button
                onClick={() => setCurrency((prev) => (prev === 'USD' ? 'PEN' : 'USD'))}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Cambiar moneda USD / PEN (Soles)"
              >
                {currency === 'USD' ? '$ USD' : 'S/ PEN'}
              </button>

              <button
                onClick={() => setNotifModalOpen(true)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 relative cursor-pointer"
                aria-label="Notificaciones"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                aria-label="Cambiar tema claro/oscuro"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setSupportModalOpen(true)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Ayuda & Copia de Seguridad JSON"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 dark:bg-indigo-950 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1">
        {/* VIEW 1: TUTORS DIRECTORY & HERO */}
        {activeView === 'tutors' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Academic Hero Section */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-indigo-900/60 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 block">
                    Red Universitaria Verificada SUNEDU · Pizarra Matemática & Gemini IA
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
                    Domina tus cursos universitarios con mentores 1-a-1 y estudio asistido.
                  </h1>
                  <p className="text-indigo-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                    Conecta con catedráticos e investigadores de UNI, PUCP, UNMSM y UP. Resuelve exámenes parciales en nuestra Pizarra Graficadora f(x), descarga clases offline (.HTML) y entrena con simulacros calificados.
                  </p>

                  {/* Search Input inside Hero */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-2xl">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por curso (Cálculo III, Python, Tesis APA, Finanzas, IELTS)..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => setGeminiModalOpen(true)}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4" /> Resolver Problema con IA
                    </button>
                  </div>
                </div>

                {/* Right KPI & Quick Access Cards */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setActiveView('classroom')}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 transition cursor-pointer"
                  >
                    <Video className="w-5 h-5 text-indigo-300 mb-2" />
                    <p className="font-extrabold text-base">Aula Virtual f(x)</p>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Pizarra interactiva y graficador matemático en vivo
                    </p>
                  </div>
                  <div
                    onClick={() => setActiveView('studio')}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 transition cursor-pointer"
                  >
                    <GraduationCap className="w-5 h-5 text-emerald-300 mb-2" />
                    <p className="font-extrabold text-base">Simulador & Notas</p>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Pomodoro Pro, Flashcards 3D y Promedio Ponderado 0-20
                    </p>
                  </div>
                  <div
                    onClick={() => setActiveView('courses')}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 transition cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-amber-300 mb-2" />
                    <p className="font-extrabold text-base">Cursos Offline</p>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Descarga paquetes .HTML y certificados verificados
                    </p>
                  </div>
                  <div
                    onClick={() => setBecomeTutorOpen(true)}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 text-sky-300 mb-2" />
                    <p className="font-extrabold text-base">Postular Docente</p>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Publica tu perfil verificado en el directorio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Sorting Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Category Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Todas las Áreas' },
                    { id: 'Matemáticas y Ciencias', label: 'Matemáticas y Ciencias' },
                    { id: 'Programación y Datos', label: 'Programación y Datos' },
                    { id: 'Humanidades y Tesis', label: 'Humanidades y Tesis' },
                    { id: 'Negocios y Finanzas', label: 'Negocios y Finanzas' },
                    { id: 'Ingeniería', label: 'Ingeniería' },
                    { id: 'Idiomas', label: 'Idiomas' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Price, Availability & Sort Controls */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      Máx: <strong className="font-mono">{formatCurrency(maxPriceUsd, currency)}/h</strong>
                    </span>
                    <input
                      type="range"
                      min={15}
                      max={40}
                      value={maxPriceUsd}
                      onChange={(e) => setMaxPriceUsd(Number(e.target.value))}
                      className="w-24 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyOnlineToday}
                      onChange={(e) => setOnlyOnlineToday(e.target.checked)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                    <span>Disponibles hoy</span>
                  </label>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="rating">Mejor Calificados (★)</option>
                    <option value="price-asc">Menor Precio</option>
                    <option value="reviews">Más Reseñas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tutors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutors.map((tutor) => (
                <article
                  key={tutor.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl ${tutor.accentColor} text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {tutor.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {tutor.name}
                            </h3>
                            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          </div>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            {tutor.category}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tutor.uni}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white block">
                          {formatCurrency(tutor.price, currency)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">/ hora</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {tutor.bio}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tutor.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {tutor.rating.toFixed(1)} ({tutor.reviews} reseñas)
                      </span>
                      <span
                        className={`font-semibold ${
                          tutor.onlineToday
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {tutor.onlineToday ? 'Disponible hoy' : 'Agenda abierta'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setBookingTutor(tutor)}
                        className="col-span-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Agendar
                      </button>
                      <button
                        onClick={() => {
                          setGeminiTutorId(tutor.id);
                          setGeminiModalOpen(true);
                        }}
                        className="col-span-1 py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> IA
                      </button>
                      <button
                        onClick={() => {
                          setClassroomTutorId(tutor.id);
                          setActiveView('classroom');
                        }}
                        className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" /> Aula
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* VIEW 2: COURSES & ASYNC ACADEMY */}
        {activeView === 'courses' && (
          <CoursesView
            courses={courses}
            setCourses={setCourses}
            tutors={tutors}
            setNotes={setNotes}
            currency={currency}
            studentName={currentUser?.name || 'Estudiante EduNexus'}
            onOpenCertificate={(title, instructor) =>
              setCertModalData({ open: true, title, instructor })
            }
            showToast={showToast}
          />
        )}

        {/* VIEW 3: STUDIO & PRACTICE PLATFORM */}
        {activeView === 'studio' && (
          <StudioView
            tutors={tutors}
            currentUserName={currentUser?.name || 'Estudiante EduNexus'}
            isVerifiedTutor={!!currentUser?.isVerifiedTutor}
            notesCount={notes.length}
            flashcardDecks={flashcardDecks}
            onUpdateFlashcards={setFlashcardDecks}
            qnaThreads={qnaThreads}
            onUpdateQna={setQnaThreads}
            groupRooms={groupRooms}
            onUpdateGroupRooms={setGroupRooms}
            weeklyHours={weeklyHours}
            onLogExtraHour={() => {
              setWeeklyHours((prev) => {
                const next = [...prev];
                next[next.length - 1] = Number((next[next.length - 1] + 0.5).toFixed(1));
                return next;
              });
              setEduPoints((prev) => prev + 10);
              showToast('+0.5h registradas y +10 EduPoints ganados', 'success');
            }}
            onSaveNote={handleSaveNoteHelper}
            onGoClassroom={() => setActiveView('classroom')}
            onNotify={(msg) => showToast(msg, 'info')}
          />
        )}

        {/* VIEW 4: INTERACTIVE VIRTUAL CLASSROOM */}
        {activeView === 'classroom' && (
          <ClassroomView
            tutors={tutors}
            activeTutor={activeClassroomTutor}
            onSelectTutor={(tut) => setClassroomTutorId(tut.id)}
            currentUserName={currentUser?.name || 'Estudiante EduNexus'}
            onSaveBoardNote={handleSaveNoteHelper}
            externalBoardState={externalBoardState}
            onNotify={(msg) => showToast(msg, 'info')}
          />
        )}

        {/* VIEW 5: SMART NOTEBOOK & LIBRARY */}
        {activeView === 'notes' && (
          <NotesView
            notes={notes}
            setNotes={setNotes}
            communityNotes={communityNotes}
            setCommunityNotes={setCommunityNotes}
            tutorMaterials={tutorMaterials}
            tutors={tutors}
            currentUserName={currentUser?.name || 'Estudiante EduNexus'}
            showToast={showToast}
          />
        )}

        {/* VIEW 6: SCHEDULED BOOKINGS & CALENDAR */}
        {activeView === 'bookings' && (
          <BookingsView
            bookings={bookings}
            setBookings={setBookings}
            tutors={tutors}
            setTutors={setTutors}
            currency={currency}
            studentName={currentUser?.name || 'Estudiante EduNexus'}
            onEnterClassroomWithTutor={(tutId) => {
              setClassroomTutorId(tutId);
              setActiveView('classroom');
            }}
            onOpenCertificate={(title, instructor) =>
              setCertModalData({ open: true, title, instructor })
            }
            onExploreTutors={() => setActiveView('tutors')}
            showToast={showToast}
          />
        )}

        {/* VIEW 7: TUTOR PORTAL */}
        {activeView === 'tutor-portal' && (
          <TutorPortalView
            tutors={tutors}
            tutorMaterials={tutorMaterials}
            setTutorMaterials={setTutorMaterials}
            setCourses={setCourses}
            currency={currency}
            showToast={showToast}
          />
        )}

        {/* VIEW 8: REALTIME SOCIAL & MULTI-ACCOUNT */}
        {activeView === 'realtime-social' && (
          <RealtimeSocialView
            currentUser={currentUser}
            savedAccounts={savedAccounts}
            onSwitchAccount={(acc) => {
              setCurrentUser(acc);
              showToast(`Sesión cambiada a ${acc.name} (${acc.role})`, 'success');
            }}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            socialPosts={socialPosts}
            setSocialPosts={setSocialPosts}
            directMessages={directMessages}
            setDirectMessages={setDirectMessages}
            showToast={showToast}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">
              EduNexus Cloud
            </span>
            <span>·</span>
            <span>Plataforma Integral de Asesorías Universitarias, Estudio y Apuntes</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveView('tutors')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              Directorio
            </button>
            <button
              onClick={() => setActiveView('courses')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              Academia Offline
            </button>
            <button
              onClick={() => setActiveView('classroom')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              Aula Graficadora
            </button>
            <button
              onClick={() => setSupportModalOpen(true)}
              className="hover:text-indigo-600 cursor-pointer"
            >
              Backup & Soporte
            </button>
          </div>
        </div>
      </footer>

      {/* GLOBAL MODALS */}
      <GoogleAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        savedAccounts={savedAccounts}
        setSavedAccounts={setSavedAccounts}
        onSelectAccount={(acc) => {
          setCurrentUser(acc);
          showToast(`Cuenta activa: ${acc.name}`, 'success');
        }}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Sesión cerrada', 'info');
        }}
        showToast={showToast}
      />

      <TutorVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onVerifiedSuccess={(docName, suneduCode) => {
          if (currentUser) {
            const updated: UserAccount = {
              ...currentUser,
              role: 'Asesor Verificado',
              isVerifiedTutor: true,
              verifiedDocName: docName,
              credentialCode: suneduCode,
            };
            setCurrentUser(updated);
            setSavedAccounts((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
          }
          setVerifyModalOpen(false);
          setActiveView('tutor-portal');
          showToast('¡Credencial SUNEDU verificada! Bienvenido al Portal del Asesor', 'success');
        }}
      />

      <BookingModal
        tutor={bookingTutor}
        onClose={() => setBookingTutor(null)}
        currency={currency}
        walletBalanceUsd={walletBalanceUsd}
        onConfirmBooking={handleConfirmBooking}
      />

      <BecomeTutorModal
        isOpen={becomeTutorOpen}
        onClose={() => setBecomeTutorOpen(false)}
        onAddTutor={(newTut) => {
          setTutors((prev) => [newTut, ...prev]);
          showToast(`${newTut.name} fue publicado en el directorio de asesores`, 'success');
        }}
      />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        currency={currency}
        walletBalanceUsd={walletBalanceUsd}
        setWalletBalanceUsd={setWalletBalanceUsd}
        eduPoints={eduPoints}
        setEduPoints={setEduPoints}
        showToast={showToast}
      />

      <GeminiModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        tutors={tutors}
        selectedTutorId={geminiTutorId}
        setSelectedTutorId={setGeminiTutorId}
        onSendToClassroomBoard={(tutId, question, boardNotes) => {
          setClassroomTutorId(tutId);
          setExternalBoardState({ question, notes: boardNotes });
          setActiveView('classroom');
          showToast('Demostración enviada a la Pizarra del Aula Virtual', 'success');
        }}
        showToast={showToast}
      />

      <NotificationsModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        }
      />

      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        onExportBackup={handleExportBackupJson}
        onImportBackup={handleImportBackupJson}
        showToast={showToast}
      />

      <CertificateModal
        isOpen={certModalData.open}
        onClose={() => setCertModalData((prev) => ({ ...prev, open: false }))}
        courseTitle={certModalData.title}
        instructorName={certModalData.instructor}
        defaultStudentName={currentUser?.name || 'Camila Mendoza'}
        showToast={showToast}
      />
    </div>
  );
}
