import { AcademicCategory } from '../utils/academicLogic';

export type ViewId =
  | 'tutors'
  | 'courses'
  | 'studio'
  | 'classroom'
  | 'notes'
  | 'bookings'
  | 'tutor-portal'
  | 'realtime-social';

export interface TutorProfile {
  id: string;
  name: string;
  category: AcademicCategory;
  uni: string;
  price: number;
  rating: number;
  reviews: number;
  onlineToday: boolean;
  initials: string;
  accentColor: string;
  tags: string[];
  bio: string;
}

export interface CourseModule {
  title: string;
  done: boolean;
}

export interface CourseComment {
  author: string;
  text: string;
}

export interface CourseItem {
  id: string;
  title: string;
  instructor: string;
  category: AcademicCategory;
  price: number;
  students: number;
  modules: CourseModule[];
  grade?: number;
  comments?: CourseComment[];
}

export interface NoteItem {
  id: string;
  title: string;
  category: AcademicCategory;
  updatedAt: string;
  body: string;
}

export interface CommunityNoteItem {
  id: string;
  title: string;
  author: string;
  category: AcademicCategory;
  likes: number;
  body: string;
}

export interface TutorMaterialItem {
  id: string;
  title: string;
  author: string;
  category: AcademicCategory;
  format: string;
  access: string;
  fileName: string;
  downloads: number;
  date: string;
  content: string;
}

export interface BookingItem {
  id: string;
  tutorId: string;
  tutorName: string;
  category: AcademicCategory;
  date: string;
  time: string;
  topic: string;
  platform: string;
  price: number;
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QnaAnswer {
  author: string;
  text: string;
}

export interface QnaThread {
  id: string;
  course: string;
  author: string;
  question: string;
  likes: number;
  answers: QnaAnswer[];
}

export interface GroupChatMessage {
  sender: string;
  text: string;
  isAi: boolean;
}

export interface GroupStudyRoom {
  id: string;
  title: string;
  category: AcademicCategory;
  maxMembers: number;
  members: string[];
  sharedNotes: string;
  chat: GroupChatMessage[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  uni: string;
  role: 'Estudiante' | 'Asesor Verificado';
  isVerifiedTutor: boolean;
  verifiedDocName: string;
  credentialCode: string;
  bonusPoints: number;
}

export interface SocialComment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  text: string;
  time: string;
}

export interface SocialPost {
  id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  author_role: string;
  category: string;
  content: string;
  created_at: string;
  likes_user_ids: string[];
  comments: SocialComment[];
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  message: string;
  time: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export const DEFAULT_TUTORS: TutorProfile[] = [
  {
    id: 'tut-1',
    name: 'Dr. Alejandro Vargas',
    category: 'Matemáticas y Ciencias',
    uni: 'UNI · Doctorado en Matemática Aplicada',
    price: 20,
    rating: 4.9,
    reviews: 128,
    onlineToday: true,
    initials: 'AV',
    accentColor: 'bg-indigo-700',
    tags: ['Cálculo I, II y III', 'Ecuaciones Diferenciales', 'Física Universitaria', 'Álgebra Lineal'],
    bio: 'Catedrático universitario con 10 años guiando a estudiantes de ingeniería y ciencias. Desarrollo en pizarra digital paso a paso y entrega de solucionarios en PDF al finalizar cada sesión.',
  },
  {
    id: 'tut-2',
    name: 'Ing. Sofía Huamán',
    category: 'Programación y Datos',
    uni: 'PUCP · Senior Data Scientist & Software Eng.',
    price: 25,
    rating: 5.0,
    reviews: 94,
    onlineToday: true,
    initials: 'SH',
    accentColor: 'bg-slate-800',
    tags: ['Python', 'Algoritmos y Estructuras', 'SQL & Bases de Datos', 'Machine Learning', 'React / Web'],
    bio: 'Mentora práctica en programación desde fundamentos hasta arquitecturas de datos e inteligencia artificial. Revisión de código en vivo y preparación para evaluaciones técnicas.',
  },
  {
    id: 'tut-3',
    name: 'Mg. Valeria Alarcón',
    category: 'Humanidades y Tesis',
    uni: 'UNMSM · Magíster en Investigación Académica',
    price: 22,
    rating: 4.9,
    reviews: 156,
    onlineToday: true,
    initials: 'VA',
    accentColor: 'bg-teal-700',
    tags: ['Asesoría de Tesis', 'Normas APA 7ma Ed.', 'Metodología de Investigación', 'SPSS / Turnitin'],
    bio: 'Especialista en estructuración de plan de tesis, marco teórico, matriz de consistencia y análisis estadístico inferencial para pregrado y posgrado.',
  },
  {
    id: 'tut-4',
    name: 'Prof. Liam O’Connor',
    category: 'Idiomas',
    uni: 'Cambridge Certified · Examinador TOEFL / IELTS',
    price: 18,
    rating: 4.8,
    reviews: 82,
    onlineToday: false,
    initials: 'LO',
    accentColor: 'bg-amber-700',
    tags: ['Inglés Conversacional', 'TOEFL iBT', 'IELTS Academic', 'Business English'],
    bio: 'Sesiones estructuradas enfocadas en fluidez oral, redacción de ensayos académicos en inglés y simulacros cronometrados para certificaciones internacionales.',
  },
  {
    id: 'tut-5',
    name: 'MBA Carlos Mendoza',
    category: 'Negocios y Finanzas',
    uni: 'Universidad del Pacífico · Consultor Financiero',
    price: 24,
    rating: 4.9,
    reviews: 67,
    onlineToday: true,
    initials: 'CM',
    accentColor: 'bg-sky-700',
    tags: ['Matemática Financiera', 'Evaluación de Proyectos', 'Excel Financiero', 'Contabilidad Gerencial'],
    bio: 'Construcción de modelos financieros, flujo de caja libre, VAN, TIR, WACC y análisis de estados financieros con casos reales en hojas de cálculo.',
  },
  {
    id: 'tut-6',
    name: 'Ing. Renato Cáceres',
    category: 'Ingeniería',
    uni: 'UTEC · Magíster en Ingeniería Mecánica y Civil',
    price: 20,
    rating: 4.8,
    reviews: 73,
    onlineToday: true,
    initials: 'RC',
    accentColor: 'bg-rose-700',
    tags: ['Estática y Dinámica', 'Resistencia de Materiales', 'Termodinámica', 'AutoCAD / MATLAB'],
    bio: 'Resolución intensiva de exámenes pasados de ingeniería con diagramas de cuerpo libre detallados, análisis estructural y simulaciones numéricas.',
  },
];

export const EXTERNAL_PLATFORMS = [
  { name: 'Google Classroom', desc: 'Cursos y entregas', url: 'https://classroom.google.com', category: 'Workspace' },
  { name: 'Google Meet', desc: 'Videollamadas HD', url: 'https://meet.google.com', category: 'Workspace' },
  { name: 'Google Drive', desc: 'Repositorio Cloud', url: 'https://drive.google.com', category: 'Workspace' },
  { name: 'Google Colab', desc: 'Notebooks Python', url: 'https://colab.research.google.com', category: 'Código' },
  { name: 'GeoGebra Suite', desc: 'Gráficas y Cálculo', url: 'https://www.geogebra.org/calculator', category: 'Matemática' },
  { name: 'WolframAlpha', desc: 'Motor simbólico', url: 'https://www.wolframalpha.com', category: 'Ciencia' },
  { name: 'Overleaf LaTeX', desc: 'Papers y Tesis', url: 'https://www.overleaf.com', category: 'Investigación' },
  { name: 'Google Scholar', desc: 'Literatura científica', url: 'https://scholar.google.com', category: 'Búsqueda' },
];

export const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Resumen de Cálculo Diferencial: Límites y Regla de la Cadena',
    category: 'Matemáticas y Ciencias',
    updatedAt: 'Hoy, 10:15 AM',
    body: `# Cálculo Diferencial — Formulario Clave

1. Definición formal de derivada:
   f'(x) = lim (h -> 0) [f(x + h) - f(x)] / h

2. Reglas fundamentales:
   • Derivada de un producto: (u · v)' = u'v + uv'
   • Derivada de un cociente: (u / v)' = (u'v - uv') / v²
   • Regla de la cadena: d/dx [f(g(x))] = f'(g(x)) · g'(x)

3. Recomendación para el examen parcial:
   Verificar siempre la continuidad de la función en el punto crítico antes de evaluar derivabilidad.`,
  },
  {
    id: 'note-2',
    title: 'Estructuras de Datos en Python y Complejidad Big-O',
    category: 'Programación y Datos',
    updatedAt: 'Ayer',
    body: `# Complejidad Temporal en Python

• Listas (list):
  - Acceso por índice l[i]: O(1)
  - append(x): O(1) amortizado
  - Búsqueda (x in l): O(n)

• Diccionarios (dict) y Conjuntos (set):
  - Búsqueda, inserción y borrado promedio: O(1) gracias a tablas hash.

• Tip para entrevistas:
  Usa collections.deque cuando necesites colas FIFO con popleft() en O(1).`,
  },
  {
    id: 'note-3',
    title: 'Estructura y Citación APA 7ma Edición para Tesis',
    category: 'Humanidades y Tesis',
    updatedAt: 'Hace 2 días',
    body: `# Guía Rápida APA 7ma Edición

• Cita narrativa (énfasis en el autor):
  Según Hernández-Sampieri (2022), el enfoque mixto permite...

• Cita parentética (énfasis en la idea):
  La validez de constructo requiere evidencia empírica (Arias, 2021, p. 45).

• Más de 3 autores:
  Desde la primera mención se utiliza "et al." luego del primer apellido.`,
  },
];

export const DEFAULT_COMMUNITY_NOTES: CommunityNoteItem[] = [
  {
    id: 'comm-1',
    title: 'Formulario Completo de Integrales Inmediatas y por Partes',
    author: 'Dr. Alejandro Vargas',
    category: 'Matemáticas y Ciencias',
    likes: 42,
    body: `# Integración por Partes (Regla ILATE)

∫ u dv = u · v - ∫ v du

Prioridad para elegir "u":
I: Inversas trigonométricas (arcsin, arctan)
L: Logarítmicas (ln x)
A: Algebraicas (polinomios x^n)
T: Trigonométricas (sin x, cos x)
E: Exponenciales (e^x)`,
  },
  {
    id: 'comm-2',
    title: 'Plantilla de Consultas SQL: JOINs, GROUP BY y Window Functions',
    author: 'Ing. Sofía Huamán',
    category: 'Programación y Datos',
    likes: 37,
    body: `# Guía Práctica SQL Analítico

SELECT departamento, nombre, salario,
       RANK() OVER (PARTITION BY departamento ORDER BY salario DESC) as ranking
FROM empleados
WHERE activo = 1;

• Recuerda: WHERE filtra filas antes de agrupar; HAVING filtra grupos después de GROUP BY.`,
  },
  {
    id: 'comm-3',
    title: 'Conectores Académicos en Inglés para Essays (TOEFL Writing)',
    author: 'Prof. Liam O’Connor',
    category: 'Idiomas',
    likes: 29,
    body: `# Academic Linking Words

• Contrast: Nevertheless, Furthermore, On the contrary, Whereas.
• Cause & Effect: Consequently, Therefore, As a result of.
• Synthesis: Taking everything into consideration, In light of the evidence presented.`,
  },
];

export const DEFAULT_TUTOR_MATERIALS: TutorMaterialItem[] = [
  {
    id: 'mat-101',
    title: 'Solucionario Completo de Exámenes Parciales de Cálculo I y II',
    author: 'Dr. Alejandro Vargas',
    category: 'Matemáticas y Ciencias',
    format: 'Guía PDF / Solucionario',
    access: 'Acceso Libre (Gratis)',
    fileName: 'solucionario_calculo_parciales.md',
    downloads: 64,
    date: 'Hace 2 días',
    content: `# Solucionario de Exámenes Parciales — Cálculo Diferencial e Integral

## Problema 1 (Límites Indeterminados 0/0)
Calcular lim (x -> 0) [sqrt(1 + 3x) - 1] / x
• Multiplicamos por la conjugada: [(1 + 3x) - 1] / [x * (sqrt(1 + 3x) + 1)] = 3 / (1 + 1) = 3/2.

## Problema 2 (Optimización con Derivadas)
Para hallar el volumen máximo de una caja sin tapa a partir de una lámina de 24x24 cm:
• V(x) = x(24 - 2x)²  =>  V'(x) = (24 - 2x)(24 - 6x) = 0  =>  x = 4 cm.`,
  },
  {
    id: 'mat-102',
    title: 'Plantilla Práctica en Python: Estructuras de Datos, Grafos y SQL',
    author: 'Ing. Sofía Huamán',
    category: 'Programación y Datos',
    format: 'Código Fuente / Notebook',
    access: 'Acceso Libre (Gratis)',
    fileName: 'algoritmos_python_entrevistas.py',
    downloads: 49,
    date: 'Ayer',
    content: `# Plantilla de Algoritmos Clave en Python

from collections import deque

def bfs_camino_mas_corto(grafo, inicio, meta):
    cola = deque([(inicio, [inicio])])
    visitados = {inicio}
    while cola:
        nodo, camino = cola.popleft()
        if nodo == meta:
            return camino
        for vecino in grafo.get(nodo, []):
            if vecino not in visitados:
                visitados.add(vecino)
                cola.append((vecino, camino + [vecino]))
    return None`,
  },
  {
    id: 'mat-103',
    title: 'Matriz de Consistencia y Estructura de Tesis (APA 7ma Edición)',
    author: 'Mg. Valeria Alarcón',
    category: 'Humanidades y Tesis',
    format: 'Plantilla / Formulario',
    access: 'Acceso Libre (Gratis)',
    fileName: 'matriz_consistencia_tesis_apa7.md',
    downloads: 35,
    date: 'Hoy',
    content: `# Matriz de Consistencia Metodológica

1. Problema General: ¿En qué medida la variable X influye en Y?
2. Objetivo General: Determinar la influencia de X sobre Y.
3. Hipótesis General: Existe una relación significativa (p < 0.05) entre X e Y.
4. Diseño: No experimental, transversal, correlacional-causal.`,
  },
];

export const DEFAULT_BOOKINGS: BookingItem[] = [
  {
    id: 'bk-101',
    tutorId: 'tut-1',
    tutorName: 'Dr. Alejandro Vargas',
    category: 'Matemáticas y Ciencias',
    date: '2026-11-10',
    time: '05:00 PM',
    topic: 'Repaso Intensivo de Ecuaciones Diferenciales y Transformada de Laplace',
    platform: 'Aula Virtual EduNexus (Pizarra Integrada)',
    price: 20,
  },
];

export const DEFAULT_FLASHCARDS: Record<string, FlashcardItem[]> = {
  calculo: [
    {
      front: '¿Cuál es la derivada de f(x) = e^(2x)?',
      back: "f'(x) = 2 · e^(2x) aplicando la regla de la cadena.",
    },
    {
      front: '¿Qué establece el Teorema Fundamental del Cálculo?',
      back: "Conecta la derivación y la integración: si F'(x) = f(x), entonces ∫[a,b] f(x)dx = F(b) - F(a).",
    },
    {
      front: '¿Cuándo existe el límite de f(x) cuando x tiende a "a"?',
      back: 'Cuando el límite lateral izquierdo y el límite lateral derecho existen y son exactamente iguales.',
    },
    {
      front: '¿Cuál es la derivada de sen(x) y cos(x)?',
      back: 'd/dx[sen(x)] = cos(x)  |  d/dx[cos(x)] = -sen(x).',
    },
  ],
  programacion: [
    {
      front: '¿Cuál es la diferencia entre una lista y una tupla en Python?',
      back: 'Las listas [] son mutables (se pueden modificar), mientras que las tuplas () son inmutables.',
    },
    {
      front: '¿Qué significa complejidad O(log n)?',
      back: 'Que el tiempo de ejecución crece logarítmicamente (ej. Búsqueda Binaria dividiendo el espacio a la mitad).',
    },
    {
      front: '¿Para qué sirve una clave primaria (Primary Key) en SQL?',
      back: 'Identifica de manera única cada fila de una tabla y no permite valores nulos ni duplicados.',
    },
  ],
  ingles: [
    {
      front: '¿Cómo usar "Although" vs "Despite" en un ensayo académico?',
      back: '"Although" va seguido de sujeto + verbo (Although it rained...). "Despite" va seguido de sustantivo o verbo en -ing (Despite the rain...).',
    },
    {
      front: 'Significado académico de "Ubiquitous"',
      back: 'Presente, existente o encontrado en todas partes al mismo tiempo (omnipresente).',
    },
    {
      front: 'Estructura de un Thesis Statement efectivo en TOEFL',
      back: 'Postura clara + 2 razones principales que se desarrollarán en los párrafos del cuerpo.',
    },
  ],
};

export const QUIZ_BANKS: Record<string, QuizQuestion[]> = {
  calculo: [
    {
      q: '1. Si f(x) = x³ - 6x² + 9x, ¿en qué valor de x alcanza un máximo local?',
      options: ['x = 1', 'x = 3', 'x = 0'],
      correct: 0,
      explanation: "f'(x) = 3x² - 12x + 9 = 3(x-1)(x-3). En x = 1, f''(1) = -6 < 0 (máximo local).",
    },
    {
      q: '2. ¿Cuál es el valor de la integral definida ∫[0 a 2] (3x²) dx?',
      options: ['6', '8', '12'],
      correct: 1,
      explanation: 'La antiderivada de 3x² es x³. Evaluando de 0 a 2: 2³ - 0³ = 8.',
    },
    {
      q: '3. ¿Cuál es el límite de (sen x) / x cuando x tiende a 0?',
      options: ['0', '1', 'No existe'],
      correct: 1,
      explanation: 'Por el límite trigonométrico fundamental, lim(x->0) sen(x)/x = 1.',
    },
  ],
  programacion: [
    {
      q: '1. ¿Qué estructura de datos utiliza el recorrido en anchura (BFS) en un grafo?',
      options: ['Cola (FIFO / Queue)', 'Pila (LIFO / Stack)', 'Árbol Binario'],
      correct: 0,
      explanation: 'BFS explora nivel por nivel empleando una estructura FIFO (First-In, First-Out).',
    },
    {
      q: '2. En SQL, ¿qué cláusula filtra grupos creados después de aplicar GROUP BY?',
      options: ['WHERE', 'HAVING', 'ORDER BY'],
      correct: 1,
      explanation: 'HAVING filtra funciones de agregación sobre grupos, mientras que WHERE filtra filas individuales.',
    },
    {
      q: '3. ¿Cuál es la complejidad temporal de buscar una clave en un diccionario (hash map) en promedio?',
      options: ['O(1)', 'O(n)', 'O(n log n)'],
      correct: 0,
      explanation: 'Las tablas hash permiten búsqueda en tiempo constante promedio O(1).',
    },
  ],
  tesis: [
    {
      q: '1. En APA 7ma edición, ¿a partir de cuántos autores se usa "et al." desde la primera cita?',
      options: ['3 o más autores', '6 o más autores', 'Solo en la bibliografía'],
      correct: 0,
      explanation: 'En APA 7, toda obra con 3 o más autores se abrevia con el primer autor seguido de "et al." desde la primera mención.',
    },
    {
      q: '2. ¿Qué coeficiente estadístico mide la correlación lineal entre dos variables numéricas normales?',
      options: ['R de Pearson', 'Chi-cuadrado', 'Alfa de Cronbach'],
      correct: 0,
      explanation: 'El coeficiente r de Pearson evalúa la correlación lineal paramétrica; Alfa de Cronbach mide fiabilidad.',
    },
    {
      q: '3. Un estudio que mide variables en un único momento temporal sin manipularlas es de tipo:',
      options: ['No experimental transversal', 'Experimental longitudinal', 'Cuasi-experimental'],
      correct: 0,
      explanation: 'Es no experimental porque no manipula variables y transversal porque recolecta datos en un solo corte de tiempo.',
    },
  ],
};

export const DEFAULT_COURSES: CourseItem[] = [
  {
    id: 'crs-1',
    title: 'Dominando Cálculo Diferencial e Integral para Ingeniería',
    instructor: 'Dr. Alejandro Vargas',
    category: 'Matemáticas y Ciencias',
    price: 35,
    students: 312,
    modules: [
      { title: 'Módulo 1: Límites, Continuidad y Asíntotas', done: true },
      { title: 'Módulo 2: Derivadas Implícitas y Regla de la Cadena', done: true },
      { title: 'Módulo 3: Integración por Partes y Fracciones Parciales', done: false },
      { title: 'Módulo 4: Aplicaciones de la Integral (Áreas y Volúmenes)', done: false },
    ],
  },
  {
    id: 'crs-2',
    title: 'Python Profesional: Estructuras de Datos, SQL y Machine Learning',
    instructor: 'Ing. Sofía Huamán',
    category: 'Programación y Datos',
    price: 42,
    students: 428,
    modules: [
      { title: 'Módulo 1: Complejidad Algorítmica y Colecciones en Python', done: true },
      { title: 'Módulo 2: Consultas Avanzadas en SQL y Modelado de Datos', done: false },
      { title: 'Módulo 3: Pandas, NumPy y Visualización Científica', done: false },
      { title: 'Módulo 4: Modelos Predictivos con Scikit-Learn', done: false },
    ],
  },
  {
    id: 'crs-3',
    title: 'Redacción y Sustentación de Tesis Universitaria (Normas APA 7)',
    instructor: 'Mg. Valeria Alarcón',
    category: 'Humanidades y Tesis',
    price: 38,
    students: 275,
    modules: [
      { title: 'Módulo 1: Planteamiento del Problema y Matriz de Consistencia', done: true },
      { title: 'Módulo 2: Búsqueda en Scopus/Web of Science y Marco Teórico', done: false },
      { title: 'Módulo 3: Diseño Metodológico y Prueba de Hipótesis en SPSS', done: false },
      { title: 'Módulo 4: Defensa Oral ante el Jurado con Diapositivas de Impacto', done: false },
    ],
  },
  {
    id: 'crs-4',
    title: 'Modelado Financiero en Excel, VAN, TIR y Flujo de Caja',
    instructor: 'MBA Carlos Mendoza',
    category: 'Negocios y Finanzas',
    price: 32,
    students: 190,
    modules: [
      { title: 'Módulo 1: Valor del Dinero en el Tiempo y Tasas Equivalentes', done: false },
      { title: 'Módulo 2: Construcción de Flujo de Caja Libre y WACC', done: false },
      { title: 'Módulo 3: Evaluación de Escenarios y Sensibilidad', done: false },
    ],
  },
];

export const DEFAULT_QNA_THREADS: QnaThread[] = [
  {
    id: 'qna-1',
    course: 'Cálculo y Matemáticas',
    author: 'Diego Quispe',
    question: '¿Cómo saber rápido si conviene aplicar integración por partes o sustitución simple?',
    likes: 14,
    answers: [
      {
        author: 'Dr. Alejandro Vargas (Asesor Verificado)',
        text: 'Si ves el producto de dos funciones de distinta naturaleza (ej. x² · e^x o x · ln(x)) y una no es la derivada interna de la otra, usa Integración por Partes con la regla ILATE.',
      },
    ],
  },
  {
    id: 'qna-2',
    course: 'Programación y Datos',
    author: 'Lucía Fernández',
    question: '¿Por qué mi consulta SQL con LEFT JOIN devuelve menos filas al poner una condición en el WHERE sobre la tabla derecha?',
    likes: 19,
    answers: [
      {
        author: 'Ing. Sofía Huamán (Asesora Verificada)',
        text: 'Porque filtrar la tabla derecha en el WHERE elimina los NULLs y convierte tu LEFT JOIN en un INNER JOIN implícito. Mueve esa condición dentro de la cláusula ON del LEFT JOIN.',
      },
    ],
  },
  {
    id: 'qna-3',
    course: 'Tesis y Metodología',
    author: 'Carlos Rivas',
    question: '¿Cuántos artículos científicos mínimos recomiendan para el Estado del Arte en una tesis de ingeniería?',
    likes: 11,
    answers: [
      {
        author: 'Mg. Valeria Alarcón (Asesora Verificada)',
        text: 'Para pregrado se recomiendan entre 15 y 25 antecedentes directos de los últimos 5 años indexados en Scopus, IEEE Xplore o SciELO.',
      },
    ],
  },
];

export const DEFAULT_GROUP_ROOMS: GroupStudyRoom[] = [
  {
    id: 'grp-1',
    title: 'Maratón de Cálculo Diferencial e Integral (Pre-Parcial)',
    category: 'Matemáticas y Ciencias',
    maxMembers: 8,
    members: ['Camila M. (UNI)', 'Diego Q. (PUCP)', 'Valeria R. (UNMSM)', 'Sebastián T.'],
    sharedNotes: `# Apuntes Colaborativos — Grupo Cálculo
• Ejercicio 1: Para lim(x->0) sen(5x)/x, multiplicamos y dividimos por 5 => resultado = 5.
• Ejercicio 2: En integración por partes de ∫ x·e^(2x) dx, tomamos u = x, dv = e^(2x) dx.`,
    chat: [
      {
        sender: 'Camila M. (UNI)',
        text: '¡Hola chicos! Estoy agregando el resumen de integrales por partes en la pizarra grupal.',
        isAi: false,
      },
      {
        sender: 'Diego Q. (PUCP)',
        text: '¡Excelente! Si tenemos duda en el ejercicio 3 podemos consultar al Moderador IA arriba.',
        isAi: false,
      },
    ],
  },
  {
    id: 'grp-2',
    title: 'Práctica Grupal de Python, SQL y Estructuras de Datos',
    category: 'Programación y Datos',
    maxMembers: 10,
    members: ['Mateo S.', 'Lucía F.', 'Andrés P.', 'Sofía H.', 'Carlos V.'],
    sharedNotes: `# Notas del Grupo Python & SQL
• Complejidad de búsqueda en set y dict: O(1) promedio.
• Para recorrer grafos por niveles usamos collections.deque con BFS.`,
    chat: [
      {
        sender: 'Lucía F.',
        text: '¿Alguien probó la consulta con LEFT JOIN y GROUP BY del laboratorio?',
        isAi: false,
      },
      {
        sender: 'Andrés P.',
        text: 'Sí, recuerda usar HAVING COUNT(*) > 1 después del GROUP BY.',
        isAi: false,
      },
    ],
  },
  {
    id: 'grp-3',
    title: 'Círculo de Tesis, Normas APA 7 y Análisis SPSS',
    category: 'Humanidades y Tesis',
    maxMembers: 6,
    members: ['Mariana G.', 'Jorge L.', 'Patricia C.'],
    sharedNotes: `# Checklist Grupal de Tesis (APA 7)
[✓] Verificar que Problema, Objetivo e Hipótesis tengan las mismas variables.
[✓] Citar con "et al." desde la primera mención para 3 o más autores.`,
    chat: [
      {
        sender: 'Mariana G.',
        text: 'Compartí las reglas de normalidad Shapiro-Wilk vs Kolmogorov-Smirnov en las notas del grupo.',
        isAi: false,
      },
    ],
  },
];

// Las publicaciones y mensajes ahora provienen únicamente de usuarios reales con sesión iniciada.
export const DEFAULT_SOCIAL_POSTS: SocialPost[] = [];

export const DEFAULT_DIRECT_MESSAGES: DirectMessage[] = [];

export const DOMAIN_SAMPLE_QUESTIONS: Record<string, string[]> = {
  'Matemáticas y Ciencias': [
    '¿Me ayudas a resolver paso a paso x^2 - 5x + 6 = 0?',
    '¿Qué es una derivada y cómo derivo f(x) = 4x^3 + sen(x)?',
    '¿Cuándo conviene usar integración por partes vs sustitución?',
  ],
  'Programación y Datos': [
    '¿Por qué mi LEFT JOIN pierde filas cuando filtro en el WHERE?',
    '¿Cuál es la diferencia práctica entre una lista y un diccionario en Python?',
    '¿Cómo implementar una función limpia para promediar datos en Python?',
  ],
  'Humanidades y Tesis': [
    '¿Cómo se cita a 3 o más autores según Normas APA 7ma edición?',
    '¿Cómo sé si debo usar R de Pearson o Rho de Spearman en mi tesis?',
    '¿Cómo alinear mi Problema General, Objetivo General e Hipótesis?',
  ],
  'Negocios y Finanzas': [
    '¿Qué son el VAN y la TIR y cómo se interpretan en un proyecto?',
    '¿Cuál es la fórmula para calcular el VAN correctamente en Excel?',
  ],
  'Ingeniería': [
    '¿Cómo plantear las ecuaciones de equilibrio en un Diagrama de Cuerpo Libre?',
    '¿Cómo aplicar la Primera Ley de la Termodinámica en volúmenes de control?',
  ],
  Idiomas: [
    '¿Cuál es la diferencia entre usar Although y Despite en un ensayo académico?',
    '¿Qué conectores formales elevan el puntaje en el Writing de TOEFL/IELTS?',
  ],
};
