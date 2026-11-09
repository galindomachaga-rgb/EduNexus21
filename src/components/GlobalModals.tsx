import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  Wallet,
  Sparkles,
  Trash2,
  Download,
  Bell,
  HelpCircle,
  UserPlus,
  CreditCard,
  ArrowRight,
  Copy,
  Globe,
  Code2,
} from 'lucide-react';
import {
  TutorProfile,
  CourseItem,
  NoteItem,
  UserAccount,
  BookingItem,
  NotificationItem,
  DOMAIN_SAMPLE_QUESTIONS,
} from '../data/seedData';
import { buildGoogleSitesStandaloneHtml } from '../utils/googleSitesExport';
import {
  AcademicCategory,
  CurrencyCode,
  formatCurrency,
  calculateBookingTotal,
} from '../utils/academicLogic';
import { consultAcademicAdvisor } from '../utils/aiClient';
import { FormattedMessage } from './FormattedMessage';

/* ============================================================================
 * 1. GOOGLE AUTH & MULTI-ACCOUNT MODAL
 * ========================================================================== */

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  savedAccounts: UserAccount[];
  setSavedAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onSelectAccount: (acc: UserAccount) => void;
  onLogout: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  savedAccounts,
  setSavedAccounts,
  onSelectAccount,
  onLogout,
  showToast,
}) => {
  const [tab, setTab] = useState<'accounts' | 'register' | 'profile'>('accounts');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regMajor, setRegMajor] = useState<string>('Ingeniería de Sistemas · PUCP');
  const [regRole, setRegRole] = useState<'Estudiante' | 'Asesor Verificado'>('Estudiante');
  const [regDocCode, setRegDocCode] = useState<string>('');
  const [regDocFile, setRegDocFile] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      showToast('Completa tu nombre y correo institucional', 'warning');
      return;
    }
    if (regRole === 'Asesor Verificado' && !regDocCode.trim() && !regDocFile) {
      showToast('Para registrarte como Asesor debes adjuntar o ingresar tu código SUNEDU', 'warning');
      return;
    }
    const newAcc: UserAccount = {
      id: 'usr_' + Date.now(),
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      uni: regMajor.trim(),
      isVerifiedTutor: regRole === 'Asesor Verificado',
      verifiedDocName: regDocFile || (regDocCode ? `SUNEDU-${regDocCode}.pdf` : ''),
      credentialCode: regDocCode || (regRole === 'Asesor Verificado' ? 'SUNEDU-2026-VERIFIED' : ''),
      bonusPoints: 50,
    };
    setSavedAccounts((prev) => [newAcc, ...prev]);
    onSelectAccount(newAcc);
    onClose();
    showToast(`Bienvenido(a), ${newAcc.name}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
              Google Identity & Multi-Account Cloud
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Gestión de Cuentas Universitarias
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'accounts', label: `Cuentas Guardadas (${savedAccounts.length})` },
            { id: 'register', label: 'Crear Cuenta' },
            ...(currentUser ? [{ id: 'profile', label: 'Mi Perfil Activo' }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'accounts' && (
          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {savedAccounts.map((acc) => {
              const isCurrent = currentUser?.id === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    onSelectAccount(acc);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {acc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          {acc.name}
                        </p>
                        {acc.isVerifiedTutor && (
                          <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                            SUNEDU ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{acc.email}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {acc.uni}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {isCurrent ? 'Activa' : 'Usar →'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'register' && (
          <form onSubmit={handleCreateAccount} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ej. Camila Mendoza"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Correo Google / Institucional
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="camila.mendoza@pucp.edu.pe"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Carrera / Especialidad
                </label>
                <input
                  type="text"
                  value={regMajor}
                  onChange={(e) => setRegMajor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Rol en EduNexus
                </label>
                <select
                  value={regRole}
                  onChange={(e) =>
                    setRegRole(e.target.value as 'Estudiante' | 'Asesor Verificado')
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Estudiante">Estudiante</option>
                  <option value="Asesor Verificado">Asesor Académico (SUNEDU)</option>
                </select>
              </div>
            </div>

            {regRole === 'Asesor Verificado' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  Verificación Documental Obligatoria para Asesores:
                </p>
                <input
                  type="text"
                  value={regDocCode}
                  onChange={(e) => setRegDocCode(e.target.value)}
                  placeholder="Código de Registro SUNEDU / Colegio Profesional"
                  className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
                <label className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{regDocFile || 'Adjuntar Constancia PDF / Imagen'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setRegDocFile(f.name);
                    }}
                  />
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
            >
              Registrar e Iniciar Sesión
            </button>
          </form>
        )}

        {tab === 'profile' && currentUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {currentUser.uni}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. MANDATORY SUNEDU TUTOR DOCUMENT VERIFICATION MODAL
 * ========================================================================== */

interface TutorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSuccess: (docName: string, suneduCode: string) => void;
}

export const TutorVerificationModal: React.FC<TutorVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifiedSuccess,
}) => {
  const [suneduCode, setSuneduCode] = useState<string>('');
  const [university, setUniversity] = useState<string>('Universidad Nacional de Ingeniería (UNI)');
  const [docName, setDocName] = useState<string>('');

  if (!isOpen) return null;

  const handleLoadDemoDocument = () => {
    setSuneduCode('SUNEDU-REG-2026-89412');
    setDocName('Diploma_Maestria_SUNEDU_Firmado.pdf');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suneduCode.trim() && !docName) return;
    onVerifiedSuccess(
      docName || 'Constancia_Universitaria_SUNEDU.pdf',
      suneduCode || 'SUNEDU-VERIFIED-2026'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Verificación Docente SUNEDU
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Para activar el modo <strong>Asesor Verificado</strong> y publicar materiales o cursos, valida tu grado académico o constancia universitaria.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Universidad / Institución Acreditada
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Código de Registro SUNEDU / CIP / ORCID
            </label>
            <input
              type="text"
              value={suneduCode}
              onChange={(e) => setSuneduCode(e.target.value)}
              placeholder="Ej. SUNEDU-REG-2026-89412"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate max-w-[170px]">
                {docName || 'Subir Diploma PDF'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDocName(f.name);
                }}
              />
            </label>

            <button
              type="button"
              onClick={handleLoadDemoDocument}
              className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer"
            >
              Cargar Constancia Demo
            </button>
          </div>

          <button
            type="submit"
            disabled={!suneduCode.trim() && !docName}
            className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
          >
            Validar Credencial y Activar Modo Asesor
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. BOOKING MODAL (Agendar Asesoría 1-a-1)
 * ========================================================================== */

interface BookingModalProps {
  tutor: TutorProfile | null;
  onClose: () => void;
  currency: CurrencyCode;
  walletBalanceUsd: number;
  onConfirmBooking: (
    booking: BookingItem,
    paymentMethod: 'yape' | 'card' | 'wallet',
    totalUsd: number
  ) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  tutor,
  onClose,
  currency,
  walletBalanceUsd,
  onConfirmBooking,
}) => {
  const [date, setDate] = useState<string>('2026-05-18');
  const [time, setTime] = useState<string>('17:00');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [topic, setTopic] = useState<string>('');
  const [platform, setPlatform] = useState<string>('Aula Nativa EduNexus');
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'card' | 'wallet'>('yape');

  if (!tutor) return null;

  const totalUsd = calculateBookingTotal(tutor.price, durationHours);
  const totalFormatted = formatCurrency(totalUsd, currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: BookingItem = {
      id: 'bk-' + Date.now(),
      tutorId: tutor.id,
      tutorName: tutor.name,
      category: tutor.category,
      date,
      time,
      topic: topic.trim() || `Sesión de ${tutor.tags[0] || tutor.category}`,
      platform,
      price: totalUsd,
    };
    onConfirmBooking(newBooking, paymentMethod, totalUsd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${tutor.accentColor} text-white font-extrabold flex items-center justify-center text-sm`}
            >
              {tutor.initials}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Agendar con {tutor.name}
              </h3>
              <p className="text-xs text-slate-500">
                {tutor.category} · Tarifa: {formatCurrency(tutor.price, currency)}/h
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Fecha de la Sesión
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Bloque Horario
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="09:00">09:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="17:00">05:00 PM</option>
                <option value="19:00">07:00 PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Duración (Horas)
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              >
                <option value={1}>1 Hora Académica</option>
                <option value={1.5}>1.5 Horas</option>
                <option value={2}>2 Horas Intensivas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Plataforma de Videollamada
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Aula Nativa EduNexus">Aula Nativa EduNexus</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom Pro">Zoom Pro</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Tema o Ejercicios Específicos a Resolver
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`Ej. Preparación Examen Parcial de ${tutor.tags[0] || tutor.category}`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'yape', label: 'Yape / Plin QR' },
                { id: 'card', label: 'Tarjeta Visa/MC' },
                {
                  id: 'wallet',
                  label: `Billetera (${formatCurrency(walletBalanceUsd, currency)})`,
                },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Total a Pagar (+10 EduPoints de regalo)
              </span>
              <span className="font-mono font-extrabold text-lg text-slate-900 dark:text-white">
                {totalFormatted}
              </span>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
            >
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. BECOME A TUTOR MODAL (Publicar Perfil en el Directorio)
 * ========================================================================== */

interface BecomeTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTutor: (tutor: TutorProfile) => void;
}

export const BecomeTutorModal: React.FC<BecomeTutorModalProps> = ({
  isOpen,
  onClose,
  onAddTutor,
}) => {
  const [name, setName] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [category, setCategory] = useState<AcademicCategory>('Matemáticas y Ciencias');
  const [priceUsd, setPriceUsd] = useState<number>(20);
  const [bio, setBio] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim()) return;
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || 'A')
      .join('');
    const newTutor: TutorProfile = {
      id: 'tut-' + Date.now(),
      name: name.trim(),
      category,
      uni: `SUNEDU Verificado · Especialista en ${specialty.trim()}`,
      rating: 5.0,
      reviews: 1,
      price: Number(priceUsd) || 20,
      onlineToday: true,
      initials,
      accentColor: 'bg-indigo-700',
      tags: [specialty.trim(), category, 'SUNEDU Verificado'],
      bio:
        bio.trim() ||
        'Asesor universitario verificado especializado en resolución de exámenes parciales y finales.',
    };
    onAddTutor(newTutor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Postular como Asesor Verificado
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Nombre y Grado Académico
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mg. Ricardo Palma"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Área
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AcademicCategory)}
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
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tarifa Hora (USD)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={priceUsd}
                onChange={(e) => setPriceUsd(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Especialidad Principal
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ej. Ecuaciones Diferenciales Parciales & MATLAB"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Biografía / Experiencia Docente
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe tu experiencia dictando cátedra o asesorías..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
          >
            Publicar Perfil en el Directorio
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. STUDENT WALLET & EDUPOINTS LOYALTY MODAL
 * ========================================================================== */

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  walletBalanceUsd: number;
  setWalletBalanceUsd: React.Dispatch<React.SetStateAction<number>>;
  eduPoints: number;
  setEduPoints: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currency,
  walletBalanceUsd,
  setWalletBalanceUsd,
  eduPoints,
  setEduPoints,
  showToast,
}) => {
  const [topUpUsd, setTopUpUsd] = useState<number>(20);

  if (!isOpen) return null;

  const handleTopUp = () => {
    setWalletBalanceUsd((prev) => prev + topUpUsd);
    showToast(`Recarga exitosa de ${formatCurrency(topUpUsd, currency)} en tu Billetera`, 'success');
  };

  const handleRedeemPoints = (cost: number, itemLabel: string) => {
    if (eduPoints < cost) {
      showToast('No tienes suficientes EduPoints para este canje', 'warning');
      return;
    }
    setEduPoints((prev) => prev - cost);
    showToast(`¡Canjeaste "${itemLabel}" con tus EduPoints!`, 'success');
  };

  const handleDownloadReceipt = () => {
    const content = [
      '====================================================',
      'EDUNEXUS CLOUD - COMPROBANTE ELECTRÓNICO DE BILLETERA',
      '====================================================',
      `Fecha de Emisión: ${new Date().toLocaleString()}`,
      `Saldo Monetario Disponible: ${formatCurrency(walletBalanceUsd, currency)}`,
      `Puntos de Fidelidad Acumulados: ${eduPoints} EduPoints`,
      'Estado: Verificado por Pasarela Académica EduNexus',
      '====================================================',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprobante_billetera_edunexus.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Comprobante electrónico descargado (.TXT)', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Billetera Estudiantil & Tienda EduPoints
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Saldo Real para Asesorías
            </span>
            <p className="text-2xl font-mono font-extrabold text-emerald-400 mt-1 mb-3">
              {formatCurrency(walletBalanceUsd, currency)}
            </p>
            <div className="flex items-center gap-2 mb-3">
              {[10, 20, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpUsd(amt)}
                  className={`flex-1 py-1 rounded-lg font-mono text-xs font-bold cursor-pointer ${
                    topUpUsd === amt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  +{formatCurrency(amt, currency)}
                </button>
              ))}
            </div>
            <button
              onClick={handleTopUp}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> Recargar vía Yape / Tarjeta
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                Programa de Fidelidad Académica
              </span>
              <p className="text-2xl font-mono font-extrabold text-indigo-950 dark:text-white mt-1">
                {eduPoints} EduPoints
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Ganas puntos completando Pomodoros, compartiendo apuntes y agendando clases.
              </p>
            </div>
            <div className="space-y-1.5 mt-3">
              <button
                onClick={() => handleRedeemPoints(20, 'Pack de Solucionarios UNI/PUCP')}
                className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between cursor-pointer"
              >
                <span>Pack Solucionarios VIP</span>
                <span className="font-mono">20 pts</span>
              </button>
              <button
                onClick={() => handleRedeemPoints(35, 'Insignia Estudiante Destacado')}
                className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between cursor-pointer"
              >
                <span>Insignia Estudiante Destacado</span>
                <span className="font-mono">35 pts</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDownloadReceipt}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Descargar Estado de Cuenta (.TXT)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. GEMINI SPECIALIST ADVISOR MODAL (Sin campos de API Key expuestos)
 * ========================================================================== */

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: TutorProfile[];
  selectedTutorId: string;
  setSelectedTutorId: (id: string) => void;
  onSendToClassroomBoard: (tutorId: string, question: string, boardNotes: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({
  isOpen,
  onClose,
  tutors,
  selectedTutorId,
  setSelectedTutorId,
  onSendToClassroomBoard,
  showToast,
}) => {
  const [histories, setHistories] = useState<
    Record<string, { sender: 'user' | 'ai'; text: string; question?: string; boardNotes?: string }[]>
  >({});
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeTutor = tutors.find((t) => t.id === selectedTutorId) || tutors[0];
  const sampleQuestions =
    DOMAIN_SAMPLE_QUESTIONS[activeTutor.category] ||
    DOMAIN_SAMPLE_QUESTIONS['Matemáticas y Ciencias'];

  const defaultGreeting = `¡Hola! Soy el **Asesor IA Especializado** de **${activeTutor.name}** (${activeTutor.category}). Estoy entrenado en ${activeTutor.tags.join(', ')}. ¿Qué problema o ejercicio resolvemos paso a paso?`;

  const currentChat = histories[activeTutor.id] || [
    {
      sender: 'ai',
      text: defaultGreeting,
    },
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? input).trim();
    if (!promptText || loading) return;

    const updatedHistory = [...currentChat, { sender: 'user' as const, text: promptText }];
    setHistories((prev) => ({ ...prev, [activeTutor.id]: updatedHistory }));
    if (!customPrompt) setInput('');
    setLoading(true);

    const result = await consultAcademicAdvisor({
      question: promptText,
      category: activeTutor.category,
      advisorName: activeTutor.name,
      tags: activeTutor.tags,
    });

    setHistories((prev) => ({
      ...prev,
      [activeTutor.id]: [
        ...updatedHistory,
        {
          sender: 'ai',
          text: result.reply,
          question: promptText,
          boardNotes: result.boardNotes,
        },
      ],
    }));
    setLoading(false);
  };

  const handleClearChat = () => {
    setHistories((prev) => ({
      ...prev,
      [activeTutor.id]: [{ sender: 'ai', text: defaultGreeting }],
    }));
    showToast('Historial de consulta reiniciado', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${activeTutor.accentColor} text-white font-extrabold flex items-center justify-center text-sm`}
            >
              {activeTutor.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-600 px-2 py-0.5 rounded font-bold">
                  Asesor IA Especializado · Gemini Cloud
                </span>
                <span className="text-xs text-indigo-300 font-mono">{activeTutor.category}</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg mt-0.5">{activeTutor.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeTutor.id}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-white"
            >
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Limpiar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Consultas rápidas:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {currentChat.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <FormattedMessage text={m.text} />
                {m.boardNotes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        onSendToClassroomBoard(
                          activeTutor.id,
                          m.question || 'Demostración Académica',
                          m.boardNotes!
                        );
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer"
                    >
                      Enviar Demostración a la Pizarra del Aula Virtual <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 animate-pulse">
              {activeTutor.name} está estructurando la resolución paso a paso...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Escribe tu problema de ${activeTutor.category} para resolverlo paso a paso...`}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Resolver
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 7. NOTIFICATIONS & SUPPORT / BACKUP MODALS
 * ========================================================================== */

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" /> Centro de Notificaciones Académicas
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2.5 max-h-72 overflow-y-auto mb-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border text-xs ${
                !n.unread
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white font-semibold'
              }`}
            >
              <p className="font-bold">{n.title}</p>
              <p className="text-[11px] opacity-85 mt-0.5">{n.desc}</p>
              <span className="text-[10px] font-mono text-slate-400">{n.time}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
          >
            Marcar todas como leídas
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  onExportBackup,
  onImportBackup,
  showToast,
}) => {
  const [ticketText, setTicketText] = useState<string>('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" /> Centro de Ayuda & Copia de Seguridad Cloud
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
            Portabilidad de Datos Académicos (Backup JSON)
          </h4>
          <p className="text-xs text-slate-500">
            Exporta todos tus apuntes, reservas, cursos y progreso en un archivo JSON o restáuralos en otro dispositivo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onExportBackup}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Backup (.JSON)
            </button>
            <label className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-indigo-600" /> Restaurar Backup
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportBackup(f);
                }}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Enviar consulta a Soporte Académico 24/7:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ticketText}
              onChange={(e) => setTicketText(e.target.value)}
              placeholder="Describe tu consulta o requerimiento..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <button
              onClick={() => {
                if (!ticketText.trim()) return;
                setTicketText('');
                showToast('Ticket enviado a Soporte Académico (#EDU-904)', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 8. GOOGLE SITES EXPORT & EMBED MODAL
 * ========================================================================== */

interface GoogleSitesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: TutorProfile[];
  courses: CourseItem[];
  notes: NoteItem[];
  bookings: BookingItem[];
  currency: CurrencyCode;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const GoogleSitesExportModal: React.FC<GoogleSitesExportModalProps> = ({
  isOpen,
  onClose,
  tutors,
  courses,
  notes,
  bookings,
  currency,
  showToast,
}) => {
  const [exportMode, setExportMode] = useState<'embed-code' | 'live-url'>('embed-code');

  if (!isOpen) return null;

  const liveAppUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ais-pre-evcjioukmqummlptrtsdmm-660240834624.us-east1.run.app';

  const standaloneHtml = buildGoogleSitesStandaloneHtml({
    tutors,
    courses,
    notes,
    bookings,
    currency,
    liveAppUrl,
  });

  const iframeSnippet = `<iframe src="${liveAppUrl}" width="100%" height="900" style="border:0; border-radius:16px; overflow:hidden;" allow="microphone; camera; clipboard-write" allowfullscreen></iframe>`;

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copiado al portapapeles`, 'success');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(`${label} copiado al portapapeles`, 'success');
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edunexus_cloud_google_sites.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo edunexus_cloud_google_sites.html descargado', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
              Integración Oficial · Google Workspace
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Exportar e Incorporar en Google Sites
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => setExportMode('embed-code')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              exportMode === 'embed-code'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Code2 className="w-4 h-4" /> Opción 1: Código HTML Autónomo
          </button>
          <button
            onClick={() => setExportMode('live-url')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              exportMode === 'live-url'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4" /> Opción 2: Incorporar por URL Cloud
          </button>
        </div>

        {exportMode === 'embed-code' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 text-xs space-y-1.5">
              <p className="font-bold text-indigo-950 dark:text-indigo-200">
                ¿Cómo pegarlo en Google Sites? (Pestaña "Código de incorporación")
              </p>
              <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 space-y-1">
                <li>Haz clic en <strong>Copiar Código HTML para Google Sites</strong> abajo.</li>
                <li>En tu página de <strong>Google Sites</strong>, ve al panel derecho → <strong>Insertar</strong> → <strong>Incorporar (&lt;&gt;)</strong>.</li>
                <li>Selecciona la pestaña <strong>Código de incorporación</strong>, pega el código HTML y pulsa <strong>Siguiente → Insertar</strong>.</li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Vista previa del paquete HTML autónomo (incluye tus asesores, cursos, apuntes y pizarra f(x)):
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {Math.round(standaloneHtml.length / 1024)} KB
                </span>
              </div>
              <textarea
                readOnly
                rows={6}
                value={standaloneHtml}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono text-[11px] p-3 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={handleDownloadStandaloneHtml}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" /> Descargar Archivo .HTML
              </button>
              <button
                onClick={() =>
                  handleCopyText(standaloneHtml, 'Código HTML para Google Sites')
                }
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Copiar Código HTML para Google Sites
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs space-y-1.5">
              <p className="font-bold text-emerald-950 dark:text-emerald-200">
                ¿Cómo incorporar la aplicación Cloud completa por URL?
              </p>
              <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 space-y-1">
                <li>En <strong>Google Sites</strong>, haz clic en <strong>Insertar</strong> → <strong>Incorporar</strong> → pestaña <strong>Por URL</strong>.</li>
                <li>Pega la URL de abajo (o usa el bloque <code>&lt;iframe&gt;</code> en "Código de incorporación") para mantener la conexión en vivo con el servidor Gemini IA.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                URL Pública de la Aplicación:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={liveAppUrl}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleCopyText(liveAppUrl, 'URL de la aplicación')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar URL
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                Snippet Iframe Responsivo para Google Sites:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={iframeSnippet}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleCopyText(iframeSnippet, 'Código Iframe')}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Iframe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

