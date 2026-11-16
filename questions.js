const QUESTIONS = [
  {
    image: "/img/q01.png",
    scenario: "Entras a la web de un banco. Escribes tu problema y el bot te obliga a elegir entre opciones de un menú cerrado (1, 2, 3...).",
    answer: false,
    why: "Es un chatbot rudimentario de Generación 1.",
    how: "Se basa en reglas fijas, palabras clave exactas y árboles de decisión rígidos. No hay IA generativa detrás."
  },
  {
    image: "/img/q02.png",
    scenario: "Haces la prueba Off-topic: le pides a un bot corporativo que te cuente un chiste o te dé una opinión personal. Se bloquea y repite un mensaje de error en bucle.",
    answer: false,
    why: "Incapacidad de salir del guion.",
    how: "Al no encontrar la palabra clave programada en su base de datos estática, el sistema colapsa. No razona ni entiende lenguaje natural."
  },
  {
    image: "/img/q03.png",
    scenario: "Preguntas (in-topic): ¿Cuál es la política si devuelvo un producto abierto hace 14 días? El bot entiende el contexto y te da una respuesta útil y conversacional basada en las normas de la empresa.",
    answer: true,
    why: "Generación Augmentada por Recuperación.",
    how: "Convierte tu duda en vectores, busca semánticamente en los documentos internos de la empresa y genera una respuesta real y actualizada sin alucinar."
  },
  {
    image: "/img/q04.png",
    scenario: "Usas el chatbot de cocina open-source (Mistral). Le pides una receta que está exactamente en el documento adjunto y te la explica con precisión quirúrgica.",
    answer: true,
    why: "Conexión directa a una base de conocimiento propia.",
    how: "El modelo de lenguaje (LLM) recibe la instrucción estricta de responder únicamente utilizando la información de los fragmentos recuperados de tu recetario."
  },
  {
    image: "/img/q05.png",
    scenario: "Subes 5 manuales de instrucciones en PDF de una cámara antigua a un Cuaderno de Gemini y le pides: «Dime exactamente qué botones pulsar para el modo nocturno».",
    answer: true,
    why: "Es el uso ideal de NotebookLM.",
    how: "Actúa como un cerebro documental. Busca en los textos subidos y extrae la respuesta exacta, citando la fuente original."
  },
  {
    image: "/img/q06.png",
    scenario: "Subes 3.000 fotografías de tus vacaciones de verano al Cuaderno de Gemini esperando que organice las fotos por caras o aplique filtros visuales.",
    answer: false,
    why: "Un Cuaderno no es una galería multimedia.",
    how: "RAG en este contexto está diseñado para análisis, síntesis y consulta de texto y documentos. Para imágenes necesitas herramientas como Google Photos o Lightroom."
  },
  {
    image: "/img/q07.png",
    scenario: "Subes todos los apuntes en PDF de una asignatura y le pides que genere ejemplos tipo test y explique conceptos difíciles basándose solo en tus apuntes.",
    answer: true,
    why: "Síntesis y recuperación controlada.",
    how: "Transforma información fragmentada en material de estudio estructurado, asegurando que no inventa datos fuera del temario."
  },
  {
    image: "/img/q08.png",
    scenario: "Subes tres contratos laborales o normativas diferentes y pides una tabla comparativa de las cláusulas de penalización.",
    answer: true,
    why: "Capacidad de cruzar datos complejos.",
    how: "El RAG recupera los fragmentos semánticamente similares de los 3 documentos simultáneamente y el LLM los formatea en una matriz comparativa."
  },
  {
    image: "/img/q09.png",
    scenario: "Conectas el Cuaderno a una tienda online para preguntarle en tiempo real: ¿Quedan camisetas de la talla M ahora mismo en la tienda física de Girona?",
    answer: false,
    why: "No es una base de datos transaccional.",
    how: "Un RAG documental trabaja con archivos estáticos indexados previamente. Para inventarios en vivo al minuto se necesitan sistemas ERP o bases de datos tradicionales."
  },
  {
    image: "/img/q10.png",
    scenario: "Subes las ordenanzas municipales sobre terrazas de bar de un ayuntamiento y le pides que elabore una guía simplificada de Preguntas Frecuentes (FAQ) para los propietarios.",
    answer: true,
    why: "Estructuración de información densa.",
    how: "Entiende el lenguaje técnico legal y lo traduce a lenguaje natural accesible, manteniendo la fidelidad a la norma original."
  },
  {
    image: "/img/q11.png",
    scenario: "Subes un archivo comprimido .ZIP de 20 GB con ejecutables y copias de seguridad para guardarlos en NotebookLM por si acaso.",
    answer: false,
    why: "No es un cajón de sastre ni un sistema de almacenamiento masivo.",
    how: "Subir archivos sin texto útil (como .exe) es inútil para la indexación vectorial. Para esto existen Google Drive o Dropbox."
  },
  {
    image: "/img/q12.png",
    scenario: "Alimentas el Cuaderno con artículos de investigación técnica y le pides que redacte una nota de prensa coherente, en tono periodístico, citando las fuentes subidas.",
    answer: true,
    why: "Generación guiada por contexto.",
    how: "El LLM aplica su conocimiento de cómo escribir una nota de prensa (formato/rol) pero extrae el qué (los datos) exclusivamente de tus artículos indexados."
  },
  {
    image: "/img/q13.png",
    scenario: "Subes un listado de síntomas complejos de un paciente y le pides al sistema que emita un diagnóstico clínico definitivo y prescriba un tratamiento.",
    answer: false,
    why: "No sustituye el criterio humano experto (límite ético y funcional → human-in-the-loop).",
    how: "Aunque puede analizar documentos médicos, los sistemas RAG no están diseñados para tomar decisiones críticas, legales o médicas sin supervisión humana."
  },
  {
    image: "/img/q14.png",
    scenario: "Subes la transcripción o el acta de una reunión larguísima y utilizas NotebookLM para generar automáticamente un resumen en formato de audio (pódcast conversacional) para escucharlo caminando.",
    answer: true,
    why: "Análisis de texto transformado a audio.",
    how: "La base del proceso sigue siendo puramente textual/documental. Recupera las ideas clave del texto y las pasa por un sintetizador de voz generativo."
  },
  {
    image: "/img/q15.png",
    scenario: "Subes un vídeo de 2 horas sin transcripción a NotebookLM y le pides que recorte un clip dinámico de 30 segundos con efectos y música para subir a TikTok.",
    answer: false,
    why: "Carece de capacidades de edición espacial/temporal.",
    how: "Un RAG documental no ve el vídeo ni edita metraje. Necesitas herramientas específicas de edición audiovisual (como CapCut o Premiere)."
  },
  {
    image: "/img/q16.png",
    scenario: "Subes un libro de relatos cortos y la guía de estilo de tu marca, y le pides que escriba un nuevo cuento corto imitando exactamente el mismo tono de voz y vocabulario.",
    answer: true,
    why: "Recuperación semántica de patrones de estilo.",
    how: "Indexa no solo hechos, sino el tono y la sintaxis de los documentos recuperados, instruyendo al LLM para mimetizar ese contexto específico."
  },
  {
    scenario: "Intentas conectar tu cuenta personal de WhatsApp en tiempo real a NotebookLM para que lea todas tus conversaciones privadas y te organice automáticamente la agenda del año.",
    answer: false,
    why: "Violación del RGPD y de la privacidad (límite legal y técnico).",
    how: "Estas herramientas no están diseñadas para conectarse a flujos de mensajería privada en vivo extrayendo datos personales sensibles. Son repositorios estáticos."
  }
];

module.exports = { QUESTIONS };
