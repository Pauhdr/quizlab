class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.init();
    }

    async init() {
        this.setupInitialEventListeners();
        this.showInputScreen();
    }

    setupInitialEventListeners() {
        document.getElementById('loadQuizBtn').addEventListener('click', () => this.loadQuestionsFromInput());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    setupEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
    }

    showInputScreen() {
        document.getElementById('inputContainer').style.display = 'block';
        document.getElementById('quizContainer').style.display = 'none';
        document.querySelector('.navigation').style.display = 'none';
        document.getElementById('finalResults').style.display = 'none';
    }

    async loadQuestionsFromInput() {
        const jsonInput = document.getElementById('jsonInput');
        const loadBtn = document.getElementById('loadQuizBtn');
        const errorMessage = document.getElementById('errorMessage');
        
        try {
            // Deshabilitar botón y mostrar estado de carga
            loadBtn.disabled = true;
            loadBtn.textContent = 'Cargando...';
            errorMessage.style.display = 'none';

            const jsonText = jsonInput.value.trim();
            
            if (!jsonText) {
                throw new Error('Por favor, introduce el texto JSON.');
            }

            // Parsear JSON
            const questions = JSON.parse(jsonText);
            
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('El JSON debe contener un array de preguntas.');
            }

            // Validar formato de preguntas
            this.validateQuestions(questions);
            
            this.questions = questions;
            this.answers = new Array(this.questions.length).fill(null);
            
            // Ocultar pantalla de entrada y mostrar quiz
            document.getElementById('inputContainer').style.display = 'none';
            document.getElementById('quizContainer').style.display = 'block';
            document.querySelector('.navigation').style.display = 'flex';
            
            this.setupEventListeners();
            this.displayQuestion();
            this.updateProgress();
            
        } catch (error) {
            this.showInputError(error.message);
        } finally {
            loadBtn.disabled = false;
            loadBtn.textContent = 'Cargar Quiz';
        }
    }

    validateQuestions(questions) {
        questions.forEach((question, index) => {
            if (!question.pregunta || typeof question.pregunta !== 'string') {
                throw new Error(`Pregunta ${index + 1}: falta la propiedad "pregunta" o no es un string.`);
            }
            
            if (!Array.isArray(question.opciones) || question.opciones.length < 2) {
                throw new Error(`Pregunta ${index + 1}: "opciones" debe ser un array con al menos 2 elementos.`);
            }
            
            if (typeof question.respuesta !== 'number' || 
                question.respuesta < 0 || 
                question.respuesta >= question.opciones.length) {
                throw new Error(`Pregunta ${index + 1}: "respuesta" debe ser un número válido (0-${question.opciones.length - 1}).`);
            }
        });
    }

    showInputError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    displayQuestion() {
        const container = document.getElementById('quizContainer');
        const question = this.questions[this.currentQuestionIndex];
        
        if (!question) {
            this.showFinalResults();
            return;
        }

        const questionHTML = `
            <div class="question-card">
                <div class="question">
                    <strong>Pregunta ${this.currentQuestionIndex + 1}:</strong> ${question.pregunta}
                </div>
                <div class="options">
                    ${question.opciones.map((opcion, index) => `
                        <div class="option" data-index="${index}" data-letter="${String.fromCharCode(65 + index)}">
                            <div class="option-text">${opcion}</div>
                        </div>
                    `).join('')}
                </div>
                <div id="feedback"></div>
            </div>
        `;

        container.innerHTML = questionHTML;

        // Restaurar respuesta anterior si existe
        if (this.answers[this.currentQuestionIndex] !== null) {
            this.showAnswerResult(this.answers[this.currentQuestionIndex], false);
        } else {
            // Agregar event listeners para las opciones
            const options = container.querySelectorAll('.option');
            options.forEach(option => {
                option.addEventListener('click', () => this.selectOption(parseInt(option.dataset.index)));
            });
        }

        this.updateNavigation();
        this.updateProgress();
        this.updateQuestionCounter();
    }

    selectOption(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const correctIndex = question.respuesta;
        
        // Guardar la respuesta
        this.answers[this.currentQuestionIndex] = selectedIndex;
        
        // Actualizar puntuación
        if (selectedIndex === correctIndex) {
            this.score++;
        }

        this.showAnswerResult(selectedIndex, true);
        this.updateScore();
    }

    showAnswerResult(selectedIndex, animate = true) {
        const question = this.questions[this.currentQuestionIndex];
        const correctIndex = question.respuesta;
        const options = document.querySelectorAll('.option');
        const feedbackDiv = document.getElementById('feedback');

        // Deshabilitar todas las opciones
        options.forEach(option => {
            option.classList.add('disabled');
            option.style.pointerEvents = 'none';
        });

        // Marcar la opción seleccionada
        options[selectedIndex].classList.add('selected');

        // Marcar la respuesta correcta
        options[correctIndex].classList.add('correct');

        // Marcar la respuesta incorrecta si es diferente
        if (selectedIndex !== correctIndex) {
            options[selectedIndex].classList.add('incorrect');
        }

        // Mostrar feedback
        const isCorrect = selectedIndex === correctIndex;
        const feedbackHTML = `
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                ${isCorrect 
                    ? '¡Correcto! 🎉' 
                    : `Incorrecto. La respuesta correcta es: <strong>${String.fromCharCode(65 + correctIndex)}) ${question.opciones[correctIndex]}</strong>`
                }
            </div>
        `;

        feedbackDiv.innerHTML = feedbackHTML;

        // Habilitar navegación
        this.updateNavigation();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // El botón siguiente se habilita si ya se respondió la pregunta actual
        const hasAnswered = this.answers[this.currentQuestionIndex] !== null;
        nextBtn.disabled = !hasAnswered;

        // Cambiar texto del botón si es la última pregunta
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.textContent = hasAnswered ? 'Ver Resultados' : 'Siguiente';
        } else {
            nextBtn.textContent = 'Siguiente';
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            this.showFinalResults();
        }
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    updateScore() {
        const answeredQuestions = this.answers.filter(answer => answer !== null).length;
        document.getElementById('score').textContent = `Puntuación: ${this.score}/${answeredQuestions}`;
    }

    updateQuestionCounter() {
        document.getElementById('questionCounter').textContent = 
            `${this.currentQuestionIndex + 1} / ${this.questions.length}`;
    }

    showFinalResults() {
        const container = document.getElementById('quizContainer');
        const navigation = document.querySelector('.navigation');
        const finalResults = document.getElementById('finalResults');
        
        container.style.display = 'none';
        navigation.style.display = 'none';
        finalResults.style.display = 'block';

        const percentage = Math.round((this.score / this.questions.length) * 100);
        let message = '';
        
        if (percentage >= 90) {
            message = '¡Excelente! 🏆';
        } else if (percentage >= 70) {
            message = '¡Muy bien! 👏';
        } else if (percentage >= 50) {
            message = 'Bien, pero puedes mejorar 👍';
        } else {
            message = 'Necesitas estudiar más 📚';
        }

        document.getElementById('finalScore').innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">${this.score}/${this.questions.length}</div>
            <div style="font-size: 1.5em; margin-bottom: 10px;">${percentage}%</div>
            <div style="color: #667eea;">${message}</div>
        `;

        // Actualizar barra de progreso al 100%
        document.getElementById('progressBar').style.width = '100%';
    }

    restart() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.questions = [];
        
        // Volver a la pantalla inicial
        this.showInputScreen();
        
        // Limpiar textarea
        document.getElementById('jsonInput').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        
        this.updateScore();
    }

    showError(message) {
        const container = document.getElementById('quizContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #dc3545;">
                <h3>Error</h3>
                <p style="margin-top: 20px;">${message}</p>
            </div>
        `;
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
