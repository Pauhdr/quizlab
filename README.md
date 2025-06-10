# Quiz Interactivo con Bancos de Preguntas y Generación por IA

Una aplicación web avanzada que permite crear quizzes de opción múltiple de tres maneras:
1. **📝 Pegar JSON**: Introducir preguntas manualmente en formato JSON
2. **📄 Subir Archivos**: Cargar documentos y generar preguntas automáticamente usando IA
3. **🏦 Banco de Preguntas**: Gestionar bancos de preguntas y crear quizzes mixtos

## 🎯 Características Principales

### Funcionalidades Core
- **Interfaz intuitiva** con tres métodos de entrada
- **Soporte para múltiples formatos** de archivo (PDF, TXT, DOCX, MD)
- **Generación automática** de preguntas usando IA
- **Bancos de preguntas** con almacenamiento local
- **Quizzes mixtos** combinando preguntas de múltiples bancos
- **Validación de respuestas** en tiempo real
- **Navegación entre preguntas** con progreso visual
- **Resultados finales** con estadísticas detalladas

### 🏦 Gestión de Bancos de Preguntas
- **Guardar preguntas** desde JSON o generación por IA
- **Organizar por temas** con nombres personalizados
- **Vista previa** de bancos con primeras preguntas
- **Selección múltiple** para crear quizzes mixtos
- **Eliminar bancos** con confirmación
- **Almacenamiento persistente** en localStorage

### 🎲 Creación de Quizzes Mixtos
- **Combinar múltiples bancos** en un solo quiz
- **Configurar cantidad** de preguntas por banco
- **Mezcla aleatoria** opcional de preguntas
- **Vista en tiempo real** de bancos seleccionados
- **Estadísticas** de preguntas disponibles

## 📁 Métodos de Entrada

### 1. 📝 Pegar JSON
```json
[
    {
        "pregunta": "¿Cuál es la capital de España?",
        "opciones": ["Madrid", "Barcelona", "Valencia", "Sevilla"],
        "respuesta": 0
    }
]
```
- ✅ Guardar automáticamente en banco de preguntas
- ✅ Validación de formato JSON
- ✅ Nombres personalizados para bancos

### 2. 📄 Subir Archivos
- **Formatos soportados**: PDF, TXT, DOCX, MD
- **Drag & Drop**: Interfaz intuitiva de arrastre
- **Configuración**: Número de preguntas y dificultad
- **Guardar resultados**: Opción de almacenar en banco
- **Procesamiento IA**: Análisis inteligente del contenido

### 3. 🏦 Banco de Preguntas
- **Gestión visual**: Lista de bancos con estadísticas
- **Selección múltiple**: Checkbox para cada banco
- **Configuración mixta**: Preguntas por banco y orden
- **Vista previa**: Primeras preguntas de cada banco
- **Eliminación segura**: Confirmación antes de borrar

## 🚀 Instalación y Configuración

### Instalación Básica
1. Descarga todos los archivos del proyecto
2. Abre `index.html` en tu navegador
3. ¡Listo! Funciona sin configuración adicional

### Estructura de Archivos
```
quiz-app/
├── index.html          # Interfaz principal
├── styles.css          # Estilos y diseño
├── script.js           # Lógica de la aplicación
├── ai-integration.js   # Framework para APIs de IA
├── README.md           # Documentación
└── input.json          # Archivo de ejemplo
```

## 🎮 Guía de Uso

### Crear Quiz desde JSON
1. Selecciona "📝 Pegar JSON"
2. Pega tu JSON en el textarea
3. ✅ Marca "Guardar en banco de preguntas" (opcional)
4. Introduce un nombre para el banco
5. Haz clic en "Cargar Quiz"

### Generar Quiz desde Archivos
1. Selecciona "📄 Subir Archivos"
2. Arrastra archivos o haz clic para seleccionar
3. Configura número de preguntas y dificultad
4. ✅ Marca "Guardar preguntas generadas" (opcional)
5. Haz clic en "Generar Quiz con IA"

### Crear Quiz Mixto
1. Selecciona "🏦 Banco de Preguntas"
2. Haz clic en "Seleccionar" en los bancos deseados
3. Configura preguntas por banco (3, 5, 10 o todas)
4. ✅ Marca "Mezclar orden" para aleatorizar
5. Haz clic en "Crear Quiz Mixto"

## 🛠️ Funcionalidades Avanzadas

### Almacenamiento Local
```javascript
// Los bancos se guardan automáticamente en localStorage
localStorage.getItem('questionBanks') // Obtener bancos
localStorage.setItem('questionBanks', data) // Guardar bancos
```

### Gestión de Bancos
- **Agregar preguntas**: Desde cualquier método de entrada
- **Vista previa**: Primeras 3 preguntas del banco
- **Estadísticas**: Número de preguntas y fecha de creación
- **Eliminación**: Con confirmación de seguridad

### Algoritmo de Mezcla
```javascript
// Mezcla inteligente de preguntas
shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
```

## 🔧 Integración con APIs de IA

### Variables de Entorno
```bash
OPENAI_API_KEY=tu_clave_openai
GOOGLE_API_KEY=tu_clave_google
```

### Configuración OpenAI
```javascript
async callAIService(fileContents, numQuestions, difficulty) {
    const generator = new AIQuestionGenerator();
    return await generator.generateQuestionsWithOpenAI(
        fileContents, numQuestions, difficulty
    );
}
```

### Configuración Google AI
```javascript
return await generator.generateQuestionsWithGoogleAI(
    fileContents, numQuestions, difficulty
);
```

## 📊 Ejemplos de Uso

### Para Estudiantes
```
1. Sube tus apuntes en PDF → Banco "Historia Medieval"
2. Carga resúmenes en TXT → Banco "Química Orgánica"  
3. Crea quiz mixto: 5 preguntas de cada banco
4. Practica con orden aleatorio
```

### Para Educadores
```
1. JSON con preguntas base → Banco "Fundamentos"
2. Sube material de clase → Banco "Avanzado"
3. Mezcla 3 preguntas básicas + 7 avanzadas
4. Evalúa progresión de conocimientos
```

### Para Entrenamientos Corporativos
```
1. Manual de procedimientos → Banco "Protocolos"
2. Casos de estudio → Banco "Casos Prácticos"
3. Quiz mixto para evaluación integral
4. Diferentes dificultades por departamento
```

## 🎨 Personalización

### Modificar Estilos
```css
/* Cambiar colores del tema */
.option-card.active {
    border-color: #tu-color;
    background: rgba(tu-color, 0.1);
}
```

### Agregar Nuevos Formatos
```javascript
validateFile(file) {
    const allowedTypes = [
        'text/plain', 'application/pdf', 
        'tu-nuevo-tipo'  // Agregar aquí
    ];
}
```

## 🔍 Resolución de Problemas

### Bancos no se guardan
- Verifica que localStorage esté habilitado
- Comprueba que no estés en modo incógnito
- Revisa la consola para errores de JavaScript

### Quiz mixto vacío
- Asegúrate de seleccionar al menos un banco
- Verifica que los bancos tengan preguntas
- Comprueba la configuración de preguntas por banco

### Archivos no se procesan
- Verifica el formato de archivo soportado
- Comprueba el tamaño (máximo 10MB)
- Revisa la consola para errores específicos

## 📈 Estadísticas y Métricas

### Datos Almacenados
- **Bancos de preguntas**: Nombre, preguntas, fechas
- **Metadatos**: Número de preguntas, dificultad
- **Historial**: Fechas de creación y modificación

### Información Mostrada
- Preguntas por banco
- Fecha de creación
- Última modificación
- Total de preguntas seleccionadas

## 🚧 Limitaciones Actuales

1. **Almacenamiento**: Solo localStorage (no sincronización)
2. **PDFs**: Procesamiento básico sin OCR
3. **IA**: Simulación (requiere configuración de APIs)
4. **Exportación**: No disponible aún
5. **Colaboración**: Solo local

## 🔮 Próximas Funcionalidades

- [ ] **Exportar/Importar bancos** en formato JSON
- [ ] **Sincronización en la nube** con Google Drive
- [ ] **Colaboración en tiempo real** para equipos
- [ ] **Analytics avanzados** de rendimiento
- [ ] **Templates de preguntas** por materia
- [ ] **OCR para PDFs escaneados**
- [ ] **API propia** para generación de preguntas
- [ ] **Modo offline** completo

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!
- 🐛 Reporta bugs en Issues
- 💡 Sugiere nuevas funcionalidades
- 📝 Mejora la documentación
- 🔧 Optimiza el código
- 🎨 Mejora el diseño

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.
Puedes usarlo, modificarlo y distribuirlo libremente.

## ⚙️ Configuración Avanzada de Puntuación

### Opciones Disponibles
- **✅ Respuestas incorrectas restan puntos**: Configurable (1-5 incorrectas = -1 punto)
- **✅ Permitir dejar preguntas en blanco**: Las respuestas en blanco no afectan la puntuación
- **🆕 Ocultar respuestas hasta el final**: No muestra feedback inmediato, incluye resumen completo al final

### Modo Ocultar Respuestas
Cuando activas "Ocultar respuestas hasta el final":
- ✅ No se muestra si la respuesta es correcta o incorrecta
- ✅ Solo confirma que se registró la respuesta
- ✅ **No se muestra la puntuación durante el quiz** - solo progreso de respuestas
- ✅ **No se revelan estadísticas** en el estado guardado del quiz
- ✅ Al finalizar, muestra un resumen detallado con:
  - Estado de cada pregunta (✓ Correcta, ✗ Incorrecta, — En blanco)
  - Tu respuesta vs. respuesta correcta
  - Todas las opciones con indicadores visuales
  - Estadísticas completas de desempeño

Durante el quiz se muestra:
- **Normal**: "Puntuación: 3/5" o "Puntuación: 3 (3✓ 2✗)"
- **Oculto**: "Progreso: 5/10 respondidas"

```javascript
// Configuración de ejemplo
scoringConfig: {
    enableNegativeScoring: true,
    incorrectPenalty: 3,
    allowBlankAnswers: true,
    hideAnswersUntilEnd: true  // Nueva funcionalidad
}
```

## ✨ Mejoras Implementadas

### Control de Modificación de Respuestas

**Comportamiento Condicional Inteligente:**

#### Modo Normal (Respuestas Inmediatas)
- ✅ **Feedback inmediato**: Las respuestas correctas/incorrectas se muestran al instante
- ✅ **Puntuación en tiempo real**: Muestra progreso actual con estadísticas
- ✅ **Respuestas definitivas**: Una vez seleccionada, no se puede cambiar la respuesta
- ✅ **Opciones deshabilitadas**: Las opciones se bloquean visualmente después de seleccionar
- ✅ **Indicadores claros**: Mensajes confirman que la respuesta es definitiva

#### Modo Oculto (Respuestas al Final)
- ✅ **Sin feedback inmediato**: Solo confirma que se registró la respuesta
- ✅ **Respuestas modificables**: Se pueden cambiar las respuestas en cualquier momento
- ✅ **Opciones activas**: Todas las opciones permanecen clicables y con indicadores visuales
- ✅ **Progreso únicamente**: Muestra "X/Y respondidas" en lugar de puntuación
- ✅ **Resumen completo**: Al finalizar, muestra análisis detallado de todas las respuestas

### Mejoras Técnicas
- 🔧 **Funciones auxiliares**: `canChangeAnswers()` y `isQuestionAnswered()` para lógica limpia
- 🔧 **Comentarios mejorados**: Código auto-documentado con explicaciones claras
- 🔧 **Consistencia**: Uso uniforme de funciones auxiliares en todo el código
- 🔧 **Feedback específico**: Mensajes diferentes según el modo de operación

### Experiencia de Usuario
- 🎯 **Claridad total**: El usuario siempre sabe qué puede y qué no puede hacer
- 🎯 **Feedback contextual**: Mensajes adaptativos según la configuración
- 🎯 **Indicadores visuales**: Estilos CSS diferentes para cada modo
- 🎯 **Navegación intuitiva**: Comportamiento predecible en ambos modos
