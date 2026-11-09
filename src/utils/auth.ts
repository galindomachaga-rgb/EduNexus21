import type { User } from '@netlify/identity';
import { UserAccount } from '../data/seedData';

/** Legacy localStorage keys that stored the old fake/demo accounts. */
export const LEGACY_ACCOUNT_KEYS = ['edunexus_accounts_v2', 'edunexus_current_user_v2'];

/** IDs of the old demo accounts, used to purge their seeded posts/messages. */
export const LEGACY_DEMO_ACCOUNT_IDS = [
  'usr_camila_mendoza_uni_edu_pe',
  'usr_mateo_salazar_prof_gmail_com',
];

/** Maps a Netlify Identity user to the app's UserAccount shape. */
export const identityUserToAccount = (user: User): UserAccount => {
  const meta = (user.userMetadata || {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const isVerifiedTutor = meta.is_verified_tutor === true;
  const email = user.email || '';
  const name = user.name || str(meta.full_name) || email.split('@')[0] || 'Estudiante';
  return {
    id: user.id,
    name,
    email,
    uni: str(meta.uni) || 'Perfil académico sin completar',
    role: isVerifiedTutor ? 'Asesor Verificado' : 'Estudiante',
    isVerifiedTutor,
    verifiedDocName: str(meta.verified_doc_name),
    credentialCode: str(meta.credential_code),
    bonusPoints: typeof meta.bonus_points === 'number' ? meta.bonus_points : 50,
  };
};

/** Translates Identity API errors into friendly Spanish messages. */
export const authErrorMessage = (err: unknown): string => {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const msg = raw.toLowerCase();
  const status = (err as { status?: number })?.status;
  if (msg.includes('invalid_grant') || msg.includes('invalid email or password') || msg.includes('no user found')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Aún no confirmas tu correo. Revisa tu bandeja de entrada (y spam).';
  }
  if (msg.includes('already been registered') || msg.includes('already registered') || msg.includes('already exists')) {
    return 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.';
  }
  if (msg.includes('signups not allowed') || msg.includes('signup') && msg.includes('disabled')) {
    return 'El registro de nuevas cuentas está deshabilitado. Solicita una invitación.';
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('length') || msg.includes('weak'))) {
    return 'La contraseña es muy corta o débil. Usa al menos 8 caracteres.';
  }
  if (msg.includes('rate limit') || status === 429) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }
  if (msg.includes('expired') || msg.includes('invalid token') || msg.includes('not found') && msg.includes('token')) {
    return 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.';
  }
  if (msg.includes('identity') && (msg.includes('not enabled') || msg.includes('missing') || msg.includes('not configured'))) {
    return 'El servicio de autenticación no está disponible en este entorno.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return raw || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
};
