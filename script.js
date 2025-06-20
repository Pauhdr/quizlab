class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.uploadedFiles = [];
        this.selectedBanks = new Set();
        this.quizInProgress = false;
        this.savedQuizState = null;
        
        // Configuración de puntuación
        this.scoringConfig = {
            enableNegativeScoring: false,
            incorrectPenalty: 3, // Cada X respuestas incorrectas restan 1 punto
            allowBlankAnswers: true,
            hideAnswersUntilEnd: false // Nueva opción para ocultar respuestas
        };
        
        this.init();
    }

    async init() {
        this.setupInitialEventListeners();
        this.loadQuestionBanks();
        this.checkForSavedQuiz();
        this.showInputScreen();
    }

    setupInitialEventListeners() {
        // Event listeners para cambiar entre métodos de entrada
        document.getElementById('jsonOption').addEventListener('click', () => this.switchInputMethod('json'));
        // document.getElementById('fileOption').addEventListener('click', () => this.switchInputMethod('file')); // Desactivado temporalmente
        document.getElementById('bankOption').addEventListener('click', () => this.switchInputMethod('bank'));
        
        // Event listeners para carga de quiz
        document.getElementById('loadQuizBtn').addEventListener('click', () => this.loadQuestionsFromInput());
        // document.getElementById('generateQuizBtn')?.addEventListener('click', () => this.generateQuestionsFromFiles()); // Desactivado temporalmente
        document.getElementById('createMixedQuizBtn').addEventListener('click', () => this.createMixedQuiz());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('exitQuizBtn').addEventListener('click', () => this.exitQuiz());
        document.getElementById('viewResultsBtn').addEventListener('click', () => this.showFinalResults());

        // Event listeners para guardar en banco
        document.getElementById('saveToBank').addEventListener('change', (e) => {
            document.getElementById('bankName').style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Event listeners para configuración de puntuación
        document.getElementById('enableNegativeScoring').addEventListener('change', (e) => {
            document.getElementById('negativeScoreConfig').style.display = e.target.checked ? 'block' : 'none';
        });
        
        document.getElementById('enableNegativeScoringMixed').addEventListener('change', (e) => {
            document.getElementById('negativeScoreConfigMixed').style.display = e.target.checked ? 'block' : 'none';
        });

        // Comentado temporalmente - funcionalidad de archivos desactivada
        // document.getElementById('saveGeneratedToBank')?.addEventListener('change', (e) => {
        //     document.getElementById('generatedBankName').style.display = e.target.checked ? 'block' : 'none';
        // });

        // Event listeners para carga de archivos - comentado temporalmente
        // this.setupFileUpload();
    }

    switchInputMethod(method) {
        const jsonOption = document.getElementById('jsonOption');
        // const fileOption = document.getElementById('fileOption'); // Desactivado temporalmente
        const bankOption = document.getElementById('bankOption');
        const jsonMethod = document.getElementById('jsonMethod');
        const fileMethod = document.getElementById('fileMethod');
        const bankMethod = document.getElementById('bankMethod');

        // Resetear estados activos
        [jsonOption, bankOption].forEach(el => el.classList.remove('active')); // fileOption removido temporalmente
        [jsonMethod, fileMethod, bankMethod].forEach(el => el.style.display = 'none');

        if (method === 'json') {
            jsonOption.classList.add('active');
            jsonMethod.style.display = 'block';
        } else if (method === 'file') {
            // Funcionalidad desactivada temporalmente
            alert('La funcionalidad de subir archivos está temporalmente desactivada');
            return;
        } else if (method === 'bank') {
            bankOption.classList.add('active');
            bankMethod.style.display = 'block';
            this.displayQuestionBanks();
        }
    }

    setupEventListeners() {
        // Remover listeners existentes para evitar duplicados
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const reviewBlankBtn = document.getElementById('reviewBlankBtn');
        
        // Clonar los botones para eliminar todos los listeners existentes
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        let newReviewBlankBtn = null;
        
        if (reviewBlankBtn) {
            newReviewBlankBtn = reviewBlankBtn.cloneNode(true);
            reviewBlankBtn.parentNode.replaceChild(newReviewBlankBtn, reviewBlankBtn);
        }
        
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        // Agregar los nuevos listeners
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        
        // Event listener para revisar preguntas en blanco
        const finalReviewBlankBtn = document.getElementById('reviewBlankBtn');
        if (finalReviewBlankBtn) {
            finalReviewBlankBtn.addEventListener('click', () => this.reviewBlankQuestions());
        }
    }

    showInputScreen() {
        document.getElementById('inputContainer').style.display = 'block';
        document.getElementById('quizContainer').style.display = 'none';
        document.querySelector('.navigation').style.display = 'none';
        document.getElementById('finalResults').style.display = 'none';
        document.getElementById('answersSummaryContainer').style.display = 'none';
        
        // Actualizar header para creación
        this.updateHeaderForCreation();
        
        // Verificar si hay un quiz guardado y mostrar la opción de continuar
        this.checkForSavedQuiz();
    }

    async loadQuestionsFromInput() {
        const jsonInput = document.getElementById('jsonInput');
        const loadBtn = document.getElementById('loadQuizBtn');
        const errorMessage = document.getElementById('errorMessage');
        const saveToBank = document.getElementById('saveToBank').checked;
        const bankName = document.getElementById('bankName').value.trim();
        
        try {
            // Resetear estado anterior si existe
            this.resetQuizState();
            
            // Capturar configuración de puntuación
            this.scoringConfig = {
                enableNegativeScoring: document.getElementById('enableNegativeScoring').checked,
                incorrectPenalty: parseInt(document.getElementById('incorrectPenalty').value),
                allowBlankAnswers: document.getElementById('allowBlankAnswers').checked,
                hideAnswersUntilEnd: document.getElementById('hideAnswersUntilEnd').checked
            };
            
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
            
            // Guardar en banco si está seleccionado
            if (saveToBank) {
                if (!bankName) {
                    throw new Error('Por favor, introduce un nombre para el banco de preguntas.');
                }
                this.saveQuestionsToBank(questions, bankName);
                alert(`Preguntas guardadas en el banco "${bankName}"`);
            }
            
            this.questions = questions;
            this.answers = new Array(this.questions.length).fill(undefined);
            
            // Iniciar quiz
            this.startQuiz();
            
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

    async generateQuestionsFromFiles() {
        const generateBtn = document.getElementById('generateQuizBtn');
        const loadingGeneration = document.getElementById('loadingGeneration');
        const errorMessage = document.getElementById('errorMessage');
        const saveToBank = document.getElementById('saveGeneratedToBank')?.checked;
        const bankName = document.getElementById('generatedBankName')?.value.trim();

        try {
            // Resetear estado anterior si existe
            this.resetQuizState();
            
            generateBtn.disabled = true;
            loadingGeneration.style.display = 'block';
            errorMessage.style.display = 'none';

            const numQuestions = parseInt(document.getElementById('numQuestions').value);
            const difficulty = document.getElementById('difficulty').value;

            // Leer el contenido de los archivos
            const fileContents = await this.readFileContents();
            
            // Generar preguntas usando IA (simulamos la llamada a NotebookLM)
            const questions = await this.callAIService(fileContents, numQuestions, difficulty);
            
            // Guardar en banco si está seleccionado
            if (saveToBank && bankName) {
                this.saveQuestionsToBank(questions, bankName);
                alert(`Preguntas generadas y guardadas en el banco "${bankName}"`);
            }
            
            this.questions = questions;
            this.answers = new Array(this.questions.length).fill(undefined);
            
            // Cambiar a la vista del quiz
            document.getElementById('inputContainer').style.display = 'none';
            document.getElementById('quizContainer').style.display = 'block';
            document.querySelector('.navigation').style.display = 'flex';
            
            this.setupEventListeners();
            this.displayQuestion();
            this.updateProgress();

        } catch (error) {
            this.showInputError(`Error generando preguntas: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            loadingGeneration.style.display = 'none';
        }
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
                    ${this.scoringConfig.allowBlankAnswers ? `
                        <div class="option blank" data-index="-1" data-letter="—">
                            <div class="option-text">💭 Dejar en blanco</div>
                        </div>
                    ` : ''}
                </div>
                <div id="feedback"></div>
            </div>
        `;

        container.innerHTML = questionHTML;

        // Siempre agregar event listeners para las opciones
        const options = container.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', () => this.selectOption(parseInt(option.dataset.index)));
        });

        // Restaurar respuesta anterior si existe
        if (this.answers[this.currentQuestionIndex] !== undefined && this.answers[this.currentQuestionIndex] !== null) {
            this.showAnswerResult(this.answers[this.currentQuestionIndex], false);
        }

        this.updateNavigation();
        this.updateQuestionCounter();
        this.updateBlankQuestionsInfo();
    }

    selectOption(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        
        // Verificar si la pregunta ya fue respondida previamente
        const wasAlreadyAnswered = this.isQuestionAnswered();
        
        // LÓGICA CORREGIDA: 
        // - Si hideAnswersUntilEnd = true: SIEMPRE permitir cambios de respuesta
        // - Si hideAnswersUntilEnd = false: NO permitir cambios una vez respondida
        
        if (!this.canChangeAnswers() && wasAlreadyAnswered) {
            // Modo normal: no permitir cambios después de responder
            return; // Bloquear completamente cualquier cambio
        }
        
        // Si es la misma respuesta, solo actualizar la visualización sin recalcular
        if (wasAlreadyAnswered && this.answers[this.currentQuestionIndex] === selectedIndex) {
            this.showAnswerResult(selectedIndex, false);
            return;
        }
        
        // Guardar la nueva respuesta (incluyendo -1 para respuestas en blanco)
        this.answers[this.currentQuestionIndex] = selectedIndex;
        
        // Recalcular puntuación completa
        this.calculateScore();

        this.showAnswerResult(selectedIndex, true);
        this.updateScore();
        this.updateProgress();
        this.updateBlankQuestionsInfo();
        
        // Guardar estado automáticamente
        this.saveQuizState();
    }

    showAnswerResult(selectedIndex, animate = true) {
        const question = this.questions[this.currentQuestionIndex];
        const correctIndex = question.respuesta;
        const options = document.querySelectorAll('.option');
        const feedbackDiv = document.getElementById('feedback');

        // Limpiar clases previas de selección
        options.forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect', 'selectable');
        });

        // Marcar la opción seleccionada
        if (selectedIndex >= 0) {
            options[selectedIndex].classList.add('selected');
        } else {
            // Respuesta en blanco
            const blankOption = document.querySelector('.option.blank');
            if (blankOption) {
                blankOption.classList.add('selected');
            }
        }

        // Si se deben ocultar las respuestas hasta el final
        if (this.canChangeAnswers()) {
            // MODO OCULTO: NO deshabilitar opciones - permitir cambios de respuesta
            options.forEach(option => {
                option.classList.remove('disabled');
                option.classList.add('selectable');
                option.style.pointerEvents = 'auto';
            });
            
            // let feedbackHTML = '';
            // if (selectedIndex === -1) {
            //     feedbackHTML = `
            //         <div class="feedback blank">
            //             💭 Has dejado esta pregunta en blanco. Puedes cambiar tu respuesta antes de finalizar el quiz.
            //         </div>
            //     `;
            // } else {
            //     feedbackHTML = `
            //         <div class="feedback selected">
            //             ✓ Respuesta registrada. Puedes cambiar tu respuesta en cualquier momento. Las respuestas se mostrarán al final del quiz.
            //         </div>
            //     `;
            // }
            
            // feedbackDiv.innerHTML = feedbackHTML;
            this.updateNavigation();
            return;
        }

        // MODO NORMAL: mostrar respuestas inmediatamente y deshabilitar opciones
        if (animate) {
            options.forEach(option => {
                option.classList.add('disabled');
                option.classList.remove('selectable');
                option.style.pointerEvents = 'none';
            });
        }

        // Marcar la respuesta correcta
        options[correctIndex].classList.add('correct');

        // Marcar la respuesta incorrecta si es diferente y no es blanco
        if (selectedIndex !== correctIndex && selectedIndex >= 0) {
            options[selectedIndex].classList.add('incorrect');
        }

        // Mostrar feedback
        let feedbackHTML = '';
        if (selectedIndex === -1) {
            // Respuesta en blanco
            feedbackHTML = `
                <div class="feedback blank">
                    💭 Has dejado esta pregunta en blanco. La respuesta correcta es: <strong>${String.fromCharCode(65 + correctIndex)}) ${question.opciones[correctIndex]}</strong>
                    <br><small>Tu decisión ha sido registrada definitivamente.</small>
                </div>
            `;
        } else if (selectedIndex === correctIndex) {
            // Respuesta correcta
            feedbackHTML = `
                <div class="feedback correct">
                    ¡Correcto! 🎉 Tu respuesta ha sido registrada definitivamente.
                </div>
            `;
        } else {
            // Respuesta incorrecta
            feedbackHTML = `
                <div class="feedback incorrect">
                    Incorrecto. La respuesta correcta es: <strong>${String.fromCharCode(65 + correctIndex)}) ${question.opciones[correctIndex]}</strong>
                    <br><small>Tu respuesta ha sido registrada definitivamente.</small>
                </div>
            `;
        }

        feedbackDiv.innerHTML = feedbackHTML;

        // Habilitar navegación
        this.updateNavigation();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // El botón siguiente siempre está habilitado - si no hay respuesta y se permite en blanco,
        // se marcará automáticamente como en blanco al avanzar
        const hasAnswered = this.answers[this.currentQuestionIndex] !== undefined && this.answers[this.currentQuestionIndex] !== null;
        const allowBlankAnswers = this.scoringConfig.allowBlankAnswers;
        
        // El botón está habilitado si:
        // 1. Ya se respondió la pregunta actual, O
        // 2. Se permiten respuestas en blanco (se marcará automáticamente al avanzar)
        nextBtn.disabled = !(hasAnswered || allowBlankAnswers);

        // Cambiar texto del botón si es la última pregunta
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.textContent = (hasAnswered || allowBlankAnswers) ? 'Ver Resultados' : 'Siguiente';
        } else {
            nextBtn.textContent = 'Siguiente';
        }
        
        // Actualizar visibilidad del botón "Ver Resultados" en el header
        this.updateViewResultsButton();
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.updateProgress();
            this.updateBlankQuestionsInfo();
            // Guardar estado automáticamente
            this.saveQuizState();
        }
    }

    nextQuestion() {
        // Verificar si la pregunta actual no ha sido respondida
        const hasAnswered = this.answers[this.currentQuestionIndex] !== undefined && this.answers[this.currentQuestionIndex] !== null;
        
        // Si no se ha respondido y se permiten respuestas en blanco, marcar automáticamente como en blanco
        if (!hasAnswered && this.scoringConfig.allowBlankAnswers) {
            this.answers[this.currentQuestionIndex] = -1; // Marcar como en blanco
            this.showAnswerResult(-1, false); // Mostrar feedback de respuesta en blanco
            this.updateScore();
            this.updateBlankQuestionsInfo();
        }
        
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.updateProgress();
            this.updateBlankQuestionsInfo();
            // Guardar estado automáticamente
            this.saveQuizState();
        } else {
            this.showFinalResults();
        }
    }

    updateProgress() {
        const answeredQuestions = this.answers.filter(answer => answer !== undefined && answer !== null).length;
        const progress = (answeredQuestions / this.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    updateScore() {
        // Si se deben ocultar las respuestas hasta el final, no mostrar puntuación
        if (!this.canChangeAnswers()) {
            // MODO NORMAL: Mostrar puntuación actual
            this.calculateScore();
            
            const answeredQuestions = this.answers.filter(answer => answer !== undefined && answer !== null).length;
            const scoreDisplay = this.score % 1 === 0 ? this.score : this.score.toFixed(2);
            let scoreText = `Puntuación: ${scoreDisplay}`;
            
            if (this.scoringConfig.enableNegativeScoring && this.scoreStats) {
                scoreText += ` (${this.scoreStats.correct}✓`;
                if (this.scoreStats.incorrect > 0) {
                    scoreText += ` ${this.scoreStats.incorrect}✗`;
                }
                if (this.scoreStats.blank > 0) {
                    scoreText += ` ${this.scoreStats.blank}—`;
                }
                scoreText += ')';
            } else {
                scoreText += `/${answeredQuestions}`;
            }
            
            document.getElementById('score').textContent = scoreText;
        } else {
            // MODO OCULTO: Solo mostrar progreso de respuestas
            const answeredQuestions = this.answers.filter(answer => answer !== undefined && answer !== null).length;
            document.getElementById('score').textContent = `Progreso: ${answeredQuestions}/${this.questions.length} respondidas`;
        }
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

        // Actualizar header para resultados (ocultar botones de navegación)
        this.updateHeaderForResults();

        // Recalcular estadísticas finales
        this.calculateScore();
        
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

        let detailedStats = '';
        if (this.scoreStats) {
            detailedStats = `
                <div style="margin: 20px 0; font-size: 1.1em;">
                    <div style="color: #28a745;">✓ Correctas: ${this.scoreStats.correct}</div>
                    <div style="color: #dc3545;">✗ Incorrectas: ${this.scoreStats.incorrect}</div>
                    ${this.scoreStats.blank > 0 ? `<div style="color: #6c757d;">— En blanco: ${this.scoreStats.blank}</div>` : ''}
                    ${this.scoringConfig.enableNegativeScoring ? 
                        `<div style="color: #ffc107; font-size: 0.9em; margin-top: 10px;">
                            💡 Penalización: Cada ${this.scoringConfig.incorrectPenalty} incorrectas restan 1 punto
                        </div>` : ''
                    }
                </div>
            `;
        }

        // Agregar resumen detallado si se ocultaron las respuestas
        if (this.canChangeAnswers()) {
            const answersSummary = this.generateAnswersSummary();
            document.getElementById('answersSummary').innerHTML = answersSummary;
            document.getElementById('answersSummaryContainer').style.display = 'block';
        } else {
            document.getElementById('answersSummaryContainer').style.display = 'none';
        }

        document.getElementById('finalScore').innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">${this.score % 1 === 0 ? this.score : this.score.toFixed(2)}/${this.questions.length}</div>
            <div style="font-size: 1.5em; margin-bottom: 10px;">${percentage}%</div>
            <div style="color: #667eea;">${message}</div>
            ${detailedStats}
        `;

        // Actualizar barra de progreso al 100%
        document.getElementById('progressBar').style.width = '100%';
        
        // Quiz completado, limpiar estado guardado
        this.quizInProgress = false;
        this.removeSavedQuizState();
    }

    restart() {
        // Resetear estado completo del quiz
        this.resetQuizState();
        
        // Limpiar variables adicionales
        this.uploadedFiles = [];
        this.selectedBanks.clear();
        
        // Limpiar sección de reanudar si existe
        const resumeSection = document.querySelector('.resume-section');
        if (resumeSection) {
            resumeSection.remove();
        }
        
        // Volver a la pantalla inicial
        this.showInputScreen();
        
        // Limpiar formularios
        document.getElementById('jsonInput').value = '';
        document.getElementById('uploadedFiles').innerHTML = '';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('loadingGeneration').style.display = 'none';
        document.getElementById('saveToBank').checked = false;
        document.getElementById('bankName').style.display = 'none';
        
        // Resetear método de entrada a JSON
        this.switchInputMethod('json');
        this.updateGenerateButton();
        this.updateCreateMixedQuizButton();
        
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

    // === GESTIÓN DE BANCOS DE PREGUNTAS ===
    
    loadQuestionBanks() {
        const banks = localStorage.getItem('questionBanks');
        this.questionBanks = banks ? JSON.parse(banks) : {};
    }

    saveQuestionBanks() {
        localStorage.setItem('questionBanks', JSON.stringify(this.questionBanks));
    }

    saveQuestionsToBank(questions, bankName) {
        if (!bankName || !questions || questions.length === 0) {
            throw new Error('Nombre del banco y preguntas son requeridos');
        }

        if (!this.questionBanks[bankName]) {
            this.questionBanks[bankName] = {
                name: bankName,
                questions: [],
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
        }

        // Agregar preguntas al banco existente
        this.questionBanks[bankName].questions.push(...questions);
        this.questionBanks[bankName].lastModified = new Date().toISOString();
        
        this.saveQuestionBanks();
        return this.questionBanks[bankName];
    }

    displayQuestionBanks() {
        const banksList = document.getElementById('banksList');
        const banks = Object.values(this.questionBanks);

        if (banks.length === 0) {
            banksList.innerHTML = '<p class="no-banks">No hay bancos de preguntas guardados</p>';
            return;
        }

        banksList.innerHTML = banks.map(bank => `
            <div class="bank-item ${this.selectedBanks.has(bank.name) ? 'selected' : ''}" data-bank="${bank.name}">
                <div class="bank-info">
                    <h5>${bank.name}</h5>
                    <p>${bank.questions.length} preguntas • Creado: ${new Date(bank.created).toLocaleDateString()}</p>
                </div>
                <div class="bank-actions">
                    <button class="bank-btn ${this.selectedBanks.has(bank.name) ? 'success' : ''}" 
                            onclick="quizApp.toggleBankSelection('${bank.name}')">
                        ${this.selectedBanks.has(bank.name) ? '✓ Seleccionado' : 'Seleccionar'}
                    </button>
                    <button class="bank-btn" onclick="quizApp.previewBank('${bank.name}')">Ver</button>
                    <button class="bank-btn danger" onclick="quizApp.deleteBank('${bank.name}')">Eliminar</button>
                </div>
            </div>
        `).join('');

        this.updateSelectedBanksDisplay();
    }

    toggleBankSelection(bankName) {
        if (this.selectedBanks.has(bankName)) {
            this.selectedBanks.delete(bankName);
        } else {
            this.selectedBanks.add(bankName);
        }
        this.displayQuestionBanks();
        this.updateCreateMixedQuizButton();
    }

    updateSelectedBanksDisplay() {
        const selectedBanksDiv = document.getElementById('selectedBanks');
        
        if (this.selectedBanks.size === 0) {
            selectedBanksDiv.innerHTML = '<p>Selecciona bancos para mezclar preguntas</p>';
        } else {
            const totalQuestions = Array.from(this.selectedBanks).reduce((total, bankName) => {
                return total + this.questionBanks[bankName].questions.length;
            }, 0);
            
            selectedBanksDiv.innerHTML = `
                <div class="selected-banks-summary">
                    <h5>Bancos seleccionados (${this.selectedBanks.size}):</h5>
                    ${Array.from(this.selectedBanks).map(bankName => `
                        <span class="selected-bank-tag">
                            ${bankName} (${this.questionBanks[bankName].questions.length})
                            <span class="remove" onclick="quizApp.toggleBankSelection('${bankName}')">×</span>
                        </span>
                    `).join('')}
                    <div class="banks-info">
                        <small>Total de preguntas disponibles: ${totalQuestions}</small>
                    </div>
                </div>
            `;
        }
    }

    updateCreateMixedQuizButton() {
        const btn = document.getElementById('createMixedQuizBtn');
        btn.disabled = this.selectedBanks.size === 0;
    }

    previewBank(bankName) {
        const bank = this.questionBanks[bankName];
        const preview = bank.questions.slice(0, 3).map((q, i) => 
            `${i + 1}. ${q.pregunta}\n   a) ${q.opciones[0]}\n   b) ${q.opciones[1]}\n   c) ${q.opciones[2]}\n   d) ${q.opciones[3]}`
        ).join('\n\n');
        
        alert(`Banco: ${bankName}\nPreguntas: ${bank.questions.length}\n\nPrimeras 3 preguntas:\n\n${preview}${bank.questions.length > 3 ? '\n\n...' : ''}`);
    }

    deleteBank(bankName) {
        if (confirm(`¿Estás seguro de que quieres eliminar el banco "${bankName}"? Esta acción no se puede deshacer.`)) {
            delete this.questionBanks[bankName];
            this.selectedBanks.delete(bankName);
            this.saveQuestionBanks();
            this.displayQuestionBanks();
        }
    }

    createMixedQuiz() {
        try {
            // Resetear estado anterior si existe
            this.resetQuizState();
            
            // Capturar configuración de puntuación
            this.scoringConfig = {
                enableNegativeScoring: document.getElementById('enableNegativeScoringMixed').checked,
                incorrectPenalty: parseInt(document.getElementById('incorrectPenaltyMixed').value),
                allowBlankAnswers: document.getElementById('allowBlankAnswersMixed').checked,
                hideAnswersUntilEnd: document.getElementById('hideAnswersUntilEndMixed').checked
            };
            
            const questionsPerBank = document.getElementById('mixQuestions').value;
            const shuffle = document.getElementById('shuffleQuestions').checked;
            
            let allQuestions = [];
            
            if (questionsPerBank === 'all') {
                // Tomar todas las preguntas de todos los bancos seleccionados
                for (const bankName of this.selectedBanks) {
                    const bank = this.questionBanks[bankName];
                    let bankQuestions = [...bank.questions];
                    
                    if (shuffle) {
                        bankQuestions = this.shuffleArray(bankQuestions);
                    }
                    
                    allQuestions.push(...bankQuestions);
                }
            } else {
                const totalQuestions = parseInt(questionsPerBank);
                const numBanks = this.selectedBanks.size;
                
                // Calcular cuántas preguntas tomar de cada banco
                const questionsPerBankCalculated = Math.floor(totalQuestions / numBanks);
                const remainingQuestions = totalQuestions % numBanks;
                
                const bankNames = Array.from(this.selectedBanks);
                let questionsCounted = 0;
                
                for (let i = 0; i < bankNames.length; i++) {
                    const bankName = bankNames[i];
                    const bank = this.questionBanks[bankName];
                    let bankQuestions = [...bank.questions];
                    
                    // Mezclar preguntas del banco para selección aleatoria
                    bankQuestions = this.shuffleArray(bankQuestions);
                    
                    // Calcular cuántas preguntas tomar de este banco
                    let questionsToTake = questionsPerBankCalculated;
                    
                    // Distribuir las preguntas restantes entre los primeros bancos
                    if (i < remainingQuestions) {
                        questionsToTake++;
                    }
                    
                    // Asegurar que no tomamos más preguntas de las que tiene el banco
                    questionsToTake = Math.min(questionsToTake, bankQuestions.length);
                    
                    // Agregar las preguntas seleccionadas
                    allQuestions.push(...bankQuestions.slice(0, questionsToTake));
                    questionsCounted += questionsToTake;
                    
                    // Si ya tenemos suficientes preguntas, parar
                    if (questionsCounted >= totalQuestions) {
                        break;
                    }
                }
                
                // Si no tenemos suficientes preguntas, intentar tomar más de los bancos que tengan disponibles
                if (questionsCounted < totalQuestions) {
                    const needed = totalQuestions - questionsCounted;
                    let taken = 0;
                    
                    for (const bankName of this.selectedBanks) {
                        if (taken >= needed) break;
                        
                        const bank = this.questionBanks[bankName];
                        const currentFromBank = allQuestions.filter(q => 
                            bank.questions.some(bq => bq.pregunta === q.pregunta)
                        ).length;
                        
                        const availableFromBank = bank.questions.length - currentFromBank;
                        
                        if (availableFromBank > 0) {
                            let bankQuestions = [...bank.questions];
                            bankQuestions = this.shuffleArray(bankQuestions);
                            
                            // Filtrar preguntas ya seleccionadas
                            bankQuestions = bankQuestions.filter(bq => 
                                !allQuestions.some(aq => aq.pregunta === bq.pregunta)
                            );
                            
                            const toTake = Math.min(needed - taken, bankQuestions.length);
                            allQuestions.push(...bankQuestions.slice(0, toTake));
                            taken += toTake;
                        }
                    }
                }
            }
            
            // Mezclar todas las preguntas si está activado
            if (shuffle) {
                allQuestions = this.shuffleArray(allQuestions);
            }
            
            if (allQuestions.length === 0) {
                throw new Error('No se encontraron preguntas en los bancos seleccionados');
            }
            
            this.questions = allQuestions;
            this.answers = new Array(this.questions.length).fill(undefined);
            
            // Iniciar quiz
            this.startQuiz();
            
        } catch (error) {
            this.showInputError(`Error creando quiz mixto: ${error.message}`);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // === CARGA DE ARCHIVOS ===

    setupFileUpload() {
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!fileUploadArea || !fileInput) return; // Si no existen los elementos

        // Click para abrir selector de archivos
        fileUploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.uploadedFiles.push(file);
                this.displayUploadedFile(file);
            }
        });
        this.updateGenerateButton();
    }

    validateFile(file) {
        const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
            this.showInputError(`Tipo de archivo no soportado: ${file.name}`);
            return false;
        }

        if (file.size > maxSize) {
            this.showInputError(`Archivo muy grande: ${file.name}. Máximo 10MB.`);
            return false;
        }

        return true;
    }

    displayUploadedFile(file) {
        const uploadedFiles = document.getElementById('uploadedFiles');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${this.getFileIcon(file.type)}</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${this.formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="remove-file" onclick="quizApp.removeFile('${file.name}')">×</button>
        `;
        uploadedFiles.appendChild(fileItem);
    }

    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word')) return '📝';
        if (fileType.includes('text')) return '📄';
        return '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        this.refreshUploadedFilesList();
        this.updateGenerateButton();
    }

    refreshUploadedFilesList() {
        const uploadedFiles = document.getElementById('uploadedFiles');
        uploadedFiles.innerHTML = '';
        this.uploadedFiles.forEach(file => this.displayUploadedFile(file));
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generateQuizBtn');
        if (generateBtn) {
            generateBtn.disabled = this.uploadedFiles.length === 0;
        }
    }

    async readFileContents() {
        const contents = [];
        
        for (const file of this.uploadedFiles) {
            try {
                const content = await this.readFileContent(file);
                contents.push({
                    filename: file.name,
                    content: content,
                    type: file.type
                });
            } catch (error) {
                console.warn(`Error leyendo archivo ${file.name}:`, error);
            }
        }
        
        return contents;
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (file.type === 'application/pdf') {
                    // Para PDFs, necesitaríamos una librería como PDF.js
                    // Por ahora, mostramos un mensaje
                    resolve('Contenido PDF - Se requiere procesamiento adicional');
                } else {
                    resolve(e.target.result);
                }
            };
            
            reader.onerror = () => reject(new Error(`Error leyendo archivo: ${file.name}`));
            
            if (file.type.includes('text') || file.name.endsWith('.md')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    async callAIService(fileContents, numQuestions, difficulty) {
        // SIMULACIÓN de llamada a API de NotebookLM/OpenAI
        // En una implementación real, aquí harías la llamada al servicio de IA
        
        return new Promise((resolve) => {
            // Simulamos delay de procesamiento
            setTimeout(() => {
                const sampleQuestions = this.generateSampleQuestions(numQuestions, difficulty, fileContents);
                resolve(sampleQuestions);
            }, 2000 + Math.random() * 3000); // 2-5 segundos
        });
    }

    generateSampleQuestions(numQuestions, difficulty, fileContents) {
        // Generamos preguntas de ejemplo basadas en el contenido
        const questions = [];
        const contentSummary = fileContents.map(f => f.content).join(' ').substring(0, 500);
        
        const templates = [
            {
                pregunta: "Según el contenido analizado, ¿cuál es el concepto principal discutido?",
                opciones: [
                    "Inteligencia Artificial",
                    "Sistemas Multiagente", 
                    "Teoría de la Computación",
                    "Bases de Datos"
                ]
            },
            {
                pregunta: "¿Qué característica es fundamental en los sistemas mencionados en el documento?",
                opciones: [
                    "Autonomía",
                    "Centralización",
                    "Simplicidad",
                    "Rigidez"
                ]
            },
            {
                pregunta: "El documento menciona principalmente conceptos relacionados con:",
                opciones: [
                    "Programación básica",
                    "Agentes inteligentes",
                    "Redes de computadoras",
                    "Matemáticas discretas"
                ]
            }
        ];

        for (let i = 0; i < numQuestions && i < templates.length; i++) {
            questions.push({
                ...templates[i],
                respuesta: Math.floor(Math.random() * 4) // Respuesta aleatoria para demo
            });
        }

        // Si necesitamos más preguntas, las generamos dinámicamente
        while (questions.length < numQuestions) {
            questions.push({
                pregunta: `Pregunta generada ${questions.length + 1} basada en el contenido del archivo`,
                opciones: [
                    "Opción A generada automáticamente",
                    "Opción B basada en el contenido",
                    "Opción C derivada del análisis",
                    "Opción D creada por IA"
                ],
                respuesta: Math.floor(Math.random() * 4)
            });
        }

        return questions.slice(0, numQuestions);
    }

    // === GESTIÓN DE ESTADO DEL QUIZ ===
    
    checkForSavedQuiz() {
        const savedState = localStorage.getItem('savedQuizState');
        if (savedState) {
            this.savedQuizState = JSON.parse(savedState);
            
            // Verificar si ya existe una sección de continuar quiz
            const existingResumeSection = document.querySelector('.resume-section');
            if (!existingResumeSection) {
                this.showResumeOption();
            } else {
                // Actualizar la información existente
                this.updateResumeOption();
            }
        } else {
            // Si no hay quiz guardado, remover la sección de continuar si existe
            const existingResumeSection = document.querySelector('.resume-section');
            if (existingResumeSection) {
                existingResumeSection.remove();
            }
        }
    }

    showResumeOption() {
        const inputContainer = document.getElementById('inputContainer');
        const resumeSection = document.createElement('div');
        resumeSection.className = 'resume-section';
        const progressText = this.savedQuizState.scoringConfig?.hideAnswersUntilEnd 
            ? `Progreso: ${this.savedQuizState.currentQuestionIndex + 1}/${this.savedQuizState.questions.length}`
            : `Progreso: ${this.savedQuizState.currentQuestionIndex + 1}/${this.savedQuizState.questions.length} 
               (${this.savedQuizState.score} correctas)`;
        
        resumeSection.innerHTML = `
            <div class="resume-card">
                <h3>🔄 Quiz Guardado</h3>
                <p>Tienes un quiz en progreso con ${this.savedQuizState.questions.length} preguntas.</p>
                <p>${progressText}</p>
                <div class="resume-actions">
                    <button id="resumeQuizBtn" class="load-btn">Continuar Quiz</button>
                    <button id="discardQuizBtn" class="discard-btn">Descartar</button>
                </div>
            </div>
        `;
        
        inputContainer.insertBefore(resumeSection, inputContainer.firstChild);
        
        document.getElementById('resumeQuizBtn').addEventListener('click', () => this.resumeQuiz());
        document.getElementById('discardQuizBtn').addEventListener('click', () => this.discardSavedQuiz());
    }

    updateResumeOption() {
        const resumeSection = document.querySelector('.resume-section');
        if (resumeSection && this.savedQuizState) {
            // Usar la configuración guardada para determinar el tipo de progreso a mostrar
            const useHiddenMode = this.savedQuizState.scoringConfig?.hideAnswersUntilEnd;
            const progressText = useHiddenMode
                ? `Progreso: ${this.savedQuizState.currentQuestionIndex + 1}/${this.savedQuizState.questions.length}`
                : `Progreso: ${this.savedQuizState.currentQuestionIndex + 1}/${this.savedQuizState.questions.length} 
                   (${this.savedQuizState.score} correctas)`;
            
            const resumeCard = resumeSection.querySelector('.resume-card');
            resumeCard.innerHTML = `
                <h3>🔄 Quiz Guardado</h3>
                <p>Tienes un quiz en progreso con ${this.savedQuizState.questions.length} preguntas.</p>
                <p>${progressText}</p>
                <div class="resume-actions">
                    <button id="resumeQuizBtn" class="load-btn">Continuar Quiz</button>
                    <button id="discardQuizBtn" class="discard-btn">Descartar</button>
                </div>
            `;
            
            // Re-añadir event listeners
            document.getElementById('resumeQuizBtn').addEventListener('click', () => this.resumeQuiz());
            document.getElementById('discardQuizBtn').addEventListener('click', () => this.discardSavedQuiz());
        }
    }

    resumeQuiz() {
        // Restaurar estado del quiz
        this.questions = this.savedQuizState.questions;
        this.currentQuestionIndex = this.savedQuizState.currentQuestionIndex;
        this.answers = this.savedQuizState.answers;
        
        // Restaurar configuración de puntuación si existe
        if (this.savedQuizState.scoringConfig) {
            this.scoringConfig = this.savedQuizState.scoringConfig;
        }
        
        // Normalizar el array de respuestas (asegurar que tenga la longitud correcta)
        if (this.answers.length !== this.questions.length) {
            const normalizedAnswers = new Array(this.questions.length).fill(undefined);
            for (let i = 0; i < Math.min(this.answers.length, this.questions.length); i++) {
                normalizedAnswers[i] = this.answers[i];
            }
            this.answers = normalizedAnswers;
        }
        
        // Recalcular el score basado en las respuestas guardadas
        this.calculateScore();
        
        // Mostrar quiz
        this.startQuiz();
        
        // Limpiar opción de reanudar
        this.removeSavedQuizState();
    }

    discardSavedQuiz() {
        this.removeSavedQuizState();
    }

    saveQuizState() {
        if (this.quizInProgress) {
            const state = {
                questions: this.questions,
                currentQuestionIndex: this.currentQuestionIndex,
                score: this.score,
                answers: this.answers,
                scoringConfig: this.scoringConfig,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('savedQuizState', JSON.stringify(state));
        }
    }

    removeSavedQuizState() {
        localStorage.removeItem('savedQuizState');
        this.savedQuizState = null;
        
        // Remover la sección de continuar quiz del DOM si existe
        const resumeSection = document.querySelector('.resume-section');
        if (resumeSection) {
            resumeSection.remove();
        }
    }

    exitQuiz() {
        if (confirm('¿Quieres guardar el progreso actual y salir del quiz?')) {
            this.saveQuizState();
            this.quizInProgress = false;
            this.showInputScreen();
            this.updateHeaderForCreation();
        }
    }

    startQuiz() {
        this.quizInProgress = true;
        
        // Cambiar a la vista del quiz
        document.getElementById('inputContainer').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        document.querySelector('.navigation').style.display = 'flex';
        document.getElementById('finalResults').style.display = 'none';
        document.getElementById('answersSummaryContainer').style.display = 'none';
        
        // Actualizar header para quiz
        this.updateHeaderForQuiz();
        
        this.setupEventListeners();
        this.displayQuestion();
        this.updateProgress();
        this.updateScore();
        this.updateQuestionCounter();
        this.updateBlankQuestionsInfo();
        this.updateViewResultsButton();
    }

    updateHeaderForCreation() {
        document.getElementById('headerTitle').textContent = 'Crear Quiz';
        document.getElementById('headerTitle').style.display = 'block';
        document.getElementById('quizHeader').style.display = 'none';
    }

    updateHeaderForQuiz() {
        document.getElementById('headerTitle').style.display = 'none';
        document.getElementById('quizHeader').style.display = 'flex';
        
        // Restaurar visibilidad de los botones cuando se inicia un quiz
        const exitBtn = document.getElementById('exitQuizBtn');
        const viewResultsBtn = document.getElementById('viewResultsBtn');
        
        if (exitBtn) exitBtn.style.display = 'block';
        if (viewResultsBtn) viewResultsBtn.style.display = 'none'; // Inicialmente oculto, se mostrará cuando corresponda
        
        // Asegurarse de que la información de preguntas en blanco se maneja correctamente
        this.updateBlankQuestionsInfo();
    }

    updateHeaderForResults() {
        // Ocultar los botones de navegación en el header cuando se muestran los resultados
        const exitBtn = document.getElementById('exitQuizBtn');
        const viewResultsBtn = document.getElementById('viewResultsBtn');
        const blankQuestionsInfo = document.getElementById('blankQuestionsInfo');
        
        if (exitBtn) exitBtn.style.display = 'none';
        if (viewResultsBtn) viewResultsBtn.style.display = 'none';
        if (blankQuestionsInfo) blankQuestionsInfo.style.display = 'none';
    }

    // === GESTIÓN DE PREGUNTAS EN BLANCO ===
    
    getBlankQuestions() {
        // Obtener índices de preguntas que han sido marcadas explícitamente como "en blanco" (valor -1)
        // NO incluir preguntas sin responder (undefined/null)
        const blankIndices = [];
        this.answers.forEach((answer, index) => {
            if (answer === -1) {
                blankIndices.push(index);
            }
        });
        return blankIndices;
    }

    updateBlankQuestionsInfo() {
        const blankQuestionsInfo = document.getElementById('blankQuestionsInfo');
        const blankCount = document.getElementById('blankCount');
        const reviewBlankBtn = document.getElementById('reviewBlankBtn');
        
        if (!blankQuestionsInfo || !blankCount || !reviewBlankBtn) return;
        
        const blankQuestions = this.getBlankQuestions();
        const blankTotal = blankQuestions.length;
        
        // Actualizar contador
        blankCount.textContent = blankTotal === 1 ? '1 en blanco' : `${blankTotal} en blanco`;
        
        // Mostrar/ocultar la sección según si hay preguntas en blanco
        if (blankTotal > 0) {
            blankQuestionsInfo.style.display = 'flex';
            reviewBlankBtn.disabled = false;
        } else {
            blankQuestionsInfo.style.display = 'none';
            reviewBlankBtn.disabled = true;
        }
        
        // NO aplicar clases CSS ni indicadores visuales en las preguntas
    }

    reviewBlankQuestions() {
        const blankQuestions = this.getBlankQuestions();
        
        if (blankQuestions.length === 0) {
            alert('¡Excelente! No hay preguntas en blanco. Todas las preguntas han sido respondidas.');
            return;
        }
        
        // Encontrar la primera pregunta en blanco después de la actual, o la primera si no hay ninguna después
        let nextBlankIndex = blankQuestions.find(index => index > this.currentQuestionIndex);
        
        if (nextBlankIndex === undefined) {
            // Si no hay preguntas en blanco después de la actual, ir a la primera
            nextBlankIndex = blankQuestions[0];
        }
        
        // Navegar a la pregunta en blanco
        this.currentQuestionIndex = nextBlankIndex;
        this.displayQuestion();
        this.updateProgress();
        this.highlightBlankQuestion();
        
        // Guardar estado automáticamente
        this.saveQuizState();
    }

    highlightBlankQuestion() {
        // Solo mostrar mensaje informativo si la pregunta actual está marcada como en blanco
        // NO aplicar animaciones ni estilos visuales
        const feedbackDiv = document.getElementById('feedback');
        if (feedbackDiv && this.answers[this.currentQuestionIndex] === -1) {
            feedbackDiv.innerHTML = `
                <div class="feedback blank-review">
                    <strong>📝 Pregunta marcada en blanco</strong><br>
                    Esta pregunta fue marcada como "en blanco". Puedes seleccionar una respuesta si cambias de opinión.
                </div>
            `;
        }
    }

    // === FUNCIONES AUXILIARES ===
    
    canChangeAnswers() {
        // Si hideAnswersUntilEnd está activado, siempre se pueden cambiar las respuestas
        // Si está desactivado, las respuestas no se pueden cambiar una vez seleccionadas
        return this.scoringConfig.hideAnswersUntilEnd;
    }

    isQuestionAnswered(questionIndex = this.currentQuestionIndex) {
        return this.answers[questionIndex] !== undefined && this.answers[questionIndex] !== null;
    }

    updateViewResultsButton() {
        const viewResultsBtn = document.getElementById('viewResultsBtn');
        if (!viewResultsBtn) return;
        
        // Verificar que todas las preguntas hayan sido respondidas o marcadas como en blanco
        const allQuestionsAnswered = this.answers.length === this.questions.length && 
                                   this.answers.every(answer => answer !== undefined && answer !== null);
        
        if (allQuestionsAnswered) {
            viewResultsBtn.style.display = 'block';
        } else {
            viewResultsBtn.style.display = 'none';
        }
    }

    // === GESTIÓN DE ESTADO COMPLETO DEL QUIZ ===
    
    resetQuizState() {
        // Resetear todas las variables del quiz
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.questions = [];
        this.quizInProgress = false;
        
        // Resetear configuración de puntuación a valores por defecto
        this.scoringConfig = {
            enableNegativeScoring: false,
            incorrectPenalty: 3,
            allowBlankAnswers: true,
            hideAnswersUntilEnd: false
        };
        
        // Limpiar estadísticas
        this.scoreStats = null;
        
        // Limpiar estado guardado
        this.removeSavedQuizState();
    }

    calculateScore() {
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let blankAnswers = 0;
        
        for (let i = 0; i < this.answers.length; i++) {
            const answer = this.answers[i];
            const question = this.questions[i];
            
            if (answer === undefined || answer === null) {
                // Pregunta no respondida aún
                continue;
            } else if (answer === -1) {
                // Respuesta en blanco
                blankAnswers++;
            } else if (answer === question.respuesta) {
                // Respuesta correcta
                correctAnswers++;
            } else {
                // Respuesta incorrecta
                incorrectAnswers++;
            }
        }
        
        // Calcular puntuación
        this.score = correctAnswers;
        
        // Aplicar penalización por respuestas incorrectas si está habilitada
        if (this.scoringConfig.enableNegativeScoring && incorrectAnswers > 0) {
            const penalty = incorrectAnswers / this.scoringConfig.incorrectPenalty;
            this.score = Math.max(0, this.score - penalty);
        }
        
        // Guardar estadísticas para mostrar
        this.scoreStats = {
            correct: correctAnswers,
            incorrect: incorrectAnswers,
            blank: blankAnswers,
            total: this.questions.length
        };
    }

    generateAnswersSummary() {
        let summaryHTML = `
            <div style="text-align: left;">
                <h3 style="text-align: center; color: #667eea; margin-bottom: 25px; padding: 20px 20px 0;">📝 Resumen Detallado de Respuestas</h3>
                <div style="padding: 0 20px 20px;">
        `;

        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            const correctAnswer = question.respuesta;
            const isCorrect = userAnswer === correctAnswer;
            const isBlank = userAnswer === -1 || userAnswer === undefined || userAnswer === null;
            
            let statusIcon = '';
            let statusColor = '';
            let userAnswerText = '';
            
            if (isBlank) {
                statusIcon = '—';
                statusColor = '#6c757d';
                userAnswerText = 'Sin respuesta';
            } else if (isCorrect) {
                statusIcon = '✓';
                statusColor = '#28a745';
                userAnswerText = `${String.fromCharCode(65 + userAnswer)}) ${question.opciones[userAnswer]}`;
            } else {
                statusIcon = '✗';
                statusColor = '#dc3545';
                userAnswerText = `${String.fromCharCode(65 + userAnswer)}) ${question.opciones[userAnswer]}`;
            }

            summaryHTML += `
                <div style="border: 1px solid #e9ecef; border-radius: 10px; margin: 15px 0; padding: 20px; background: ${isCorrect ? 'rgba(40, 167, 69, 0.05)' : (isBlank ? 'rgba(108, 117, 125, 0.05)' : 'rgba(220, 53, 69, 0.05)')};">
                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                        <div style="color: ${statusColor}; font-size: 1.5em; font-weight: bold; min-width: 30px;">
                            ${statusIcon}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 10px; color: #333;">
                                Pregunta ${index + 1}: ${question.pregunta}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: ${statusColor};">Tu respuesta:</strong> 
                                <span style="color: ${statusColor};">${userAnswerText}</span>
                            </div>
                            ${!isCorrect ? `
                                <div style="margin-bottom: 10px;">
                                    <strong style="color: #28a745;">Respuesta correcta:</strong> 
                                    <span style="color: #28a745;">${String.fromCharCode(65 + correctAnswer)}) ${question.opciones[correctAnswer]}</span>
                                </div>
                            ` : ''}
                            <div style="margin-top: 15px;">
                                <div style="font-size: 0.9em; color: #666; margin-bottom: 8px;"><strong>Opciones:</strong></div>
                                ${question.opciones.map((opcion, optIndex) => `
                                    <div style="margin: 5px 0; padding: 8px; border-radius: 5px; font-size: 0.9em; ${
                                        optIndex === correctAnswer 
                                            ? 'background: rgba(40, 167, 69, 0.1); border-left: 3px solid #28a745;' 
                                            : (optIndex === userAnswer && !isCorrect && !isBlank)
                                                ? 'background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545;'
                                                : 'background: #f8f9fa; border-left: 3px solid transparent;'
                                    }">
                                        <strong>${String.fromCharCode(65 + optIndex)})</strong> ${opcion}
                                        ${optIndex === correctAnswer ? ' <span style="color: #28a745; font-weight: bold;">✓</span>' : ''}
                                        ${optIndex === userAnswer && !isCorrect && !isBlank ? ' <span style="color: #dc3545; font-weight: bold;">✗</span>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        summaryHTML += `</div></div>`;
        return summaryHTML;
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
