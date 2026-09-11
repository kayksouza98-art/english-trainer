"use strict";

console.log("English Trainer: script.js carregado.");

const direction =
    document.getElementById("direction");

const speed =
    document.getElementById("speed");

const voiceSelect =
    document.getElementById("voice");

const inputText =
    document.getElementById("input-text");

const outputText =
    document.getElementById("output-text");

const inputTitle =
    document.getElementById("input-title");

const outputTitle =
    document.getElementById("output-title");

const translateButton =
    document.getElementById("translate-button");

const clearButton =
    document.getElementById("clear-button");

const copyButton =
    document.getElementById("copy-button");

const speakButton =
    document.getElementById("speak-button");

const wordButton =
    document.getElementById("word-button");

const stopButton =
    document.getElementById("stop-button");

const wordContainer =
    document.getElementById("word-container");

const statusText =
    document.getElementById("status");

const charCount =
    document.getElementById("char-count");

const writingInput =
    document.getElementById("writing-input");

const writingStatus =
    document.getElementById("writing-status");

const autoRead =
    document.getElementById("auto-read");

const clearWritingButton =
    document.getElementById("clear-writing-button");

const DEFAULT_OUTPUT =
    "Sua tradução aparecerá aqui.";

const ERROR_OUTPUT =
    "Erro na tradução.";

let voices = [];
let words = [];
let currentIndex = 0;
let reading = false;
let readingTimer = null;

let previousWritingValue = "";
let lastSpokenWritingValue = "";


// ============================================================
// CONFIGURAÇÃO DE DIREÇÃO E VOZ
// ============================================================

function updateDirection() {
    if (direction.value === "pt-en") {
        inputTitle.textContent =
            "🇧🇷 Português";

        outputTitle.textContent =
            "🇺🇸 Inglês";

        inputText.placeholder =
            "Digite uma frase em português...";
    } else {
        inputTitle.textContent =
            "🇺🇸 Inglês";

        outputTitle.textContent =
            "🇧🇷 Português";

        inputText.placeholder =
            "Digite uma frase em inglês...";
    }

    loadVoices();
}

function getSpeechLanguage() {
    return direction.value === "pt-en"
        ? "en-US"
        : "pt-BR";
}

function loadVoices() {
    if (!("speechSynthesis" in window)) {
        voiceSelect.innerHTML = "";

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            "Voz não suportada";

        voiceSelect.appendChild(option);
        return;
    }

    voices =
        speechSynthesis.getVoices();

    const oldVoice =
        voiceSelect.value;

    const languagePrefix =
        getSpeechLanguage()
            .substring(0, 2)
            .toLowerCase();

    const preferredVoices =
        voices.filter(voice =>
            voice.lang
                .toLowerCase()
                .startsWith(languagePrefix)
        );

    const availableVoices =
        preferredVoices.length > 0
            ? preferredVoices
            : voices;

    voiceSelect.innerHTML = "";

    if (availableVoices.length === 0) {
        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            "Nenhuma voz encontrada";

        voiceSelect.appendChild(option);
        return;
    }

    availableVoices.forEach(voice => {
        const option =
            document.createElement("option");

        option.value = voice.name;
        option.textContent =
            `${voice.name} (${voice.lang})`;

        voiceSelect.appendChild(option);
    });

    const oldVoiceExists =
        availableVoices.some(
            voice => voice.name === oldVoice
        );

    if (oldVoiceExists) {
        voiceSelect.value = oldVoice;
    }
}

function getSelectedVoice() {
    return voices.find(
        voice => voice.name === voiceSelect.value
    );
}

function createUtterance(text) {
    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang =
        getSpeechLanguage();

    utterance.rate =
        Number(speed.value);

    const selectedVoice =
        getSelectedVoice();

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    return utterance;
}

direction.addEventListener(
    "change",
    () => {
        stopAllSpeech();
        updateDirection();

        writingStatus.textContent =
            "Idioma da pronúncia atualizado.";
    }
);

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged =
        loadVoices;
}


// ============================================================
// CONTADOR
// ============================================================

inputText.addEventListener(
    "input",
    () => {
        charCount.textContent =
            `${inputText.value.length} caracteres`;
    }
);


// ============================================================
// TRADUÇÃO
// ============================================================

async function translate() {
    const text =
        inputText.value.trim();

    if (!text) {
        alert("Digite uma frase primeiro.");
        inputText.focus();
        return;
    }

    stopReading();

    translateButton.disabled = true;
    translateButton.textContent =
        "⏳ Traduzindo...";

    outputText.textContent =
        "Traduzindo...";

    statusText.textContent =
        "Conectando ao tradutor...";

    try {
        const response =
            await fetch("/translate", {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    text: text,
                    direction: direction.value
                })
            });

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Erro na tradução."
            );
        }

        const translation =
            String(
                data.translation || ""
            ).trim();

        if (!translation) {
            throw new Error(
                "A tradução retornou vazia."
            );
        }

        outputText.textContent =
            translation;

        createWords(translation);

        statusText.textContent =
            "✓ Tradução concluída";

    } catch (error) {
        console.error(
            "Erro na tradução:",
            error
        );

        outputText.textContent =
            ERROR_OUTPUT;

        wordContainer.innerHTML = `
            <span class="empty">
                Não foi possível criar as palavras.
            </span>
        `;

        words = [];

        statusText.textContent =
            "❌ Erro";

        alert(
            `Erro ao traduzir:\n\n${error.message}`
        );

    } finally {
        translateButton.disabled = false;

        translateButton.textContent =
            "✨ Traduzir";
    }
}

translateButton.addEventListener(
    "click",
    translate
);

inputText.addEventListener(
    "keydown",
    event => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            translate();
        }
    }
);


// ============================================================
// PALAVRAS DA TRADUÇÃO
// ============================================================

function splitWords(text) {
    return text.match(
        /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu
    ) || [];
}

function createWords(text) {
    wordContainer.innerHTML = "";

    words =
        splitWords(text);

    if (words.length === 0) {
        wordContainer.innerHTML = `
            <span class="empty">
                Nenhuma palavra encontrada.
            </span>
        `;

        return;
    }

    words.forEach((word, index) => {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "word";
        button.textContent = word;
        button.title =
            "Clique para ouvir esta palavra";

        button.addEventListener(
            "click",
            () => {
                speakWord(word, index);
            }
        );

        wordContainer.appendChild(button);
    });

    statusText.textContent =
        `${words.length} palavras`;
}


// ============================================================
// LEITURA DA FRASE
// ============================================================

function hasValidTranslation() {
    const text =
        outputText.textContent.trim();

    return (
        text &&
        text !== DEFAULT_OUTPUT &&
        text !== ERROR_OUTPUT &&
        text !== "Traduzindo..."
    );
}

function speakSentence() {
    if (!hasValidTranslation()) {
        alert("Traduza uma frase primeiro.");
        return;
    }

    stopReading();

    const utterance =
        createUtterance(
            outputText.textContent.trim()
        );

    statusText.textContent =
        "🔊 Lendo frase...";

    utterance.onend = () => {
        statusText.textContent =
            "Pronto";
    };

    utterance.onerror = () => {
        statusText.textContent =
            "❌ Erro na leitura";
    };

    speechSynthesis.speak(utterance);
}

speakButton.addEventListener(
    "click",
    speakSentence
);


// ============================================================
// LEITURA DE UMA PALAVRA
// ============================================================

function speakWord(word, index) {
    stopReading();
    clearActive();

    const elements =
        document.querySelectorAll(".word");

    if (elements[index]) {
        elements[index].classList.add("active");
    }

    const utterance =
        createUtterance(word);

    statusText.textContent =
        `🔊 ${word}`;

    utterance.onend = () => {
        clearActive();
        statusText.textContent =
            "Pronto";
    };

    utterance.onerror = () => {
        clearActive();
        statusText.textContent =
            "❌ Erro na leitura";
    };

    speechSynthesis.speak(utterance);
}


// ============================================================
// PALAVRA POR PALAVRA
// ============================================================

function speakWords() {
    if (words.length === 0) {
        alert("Traduza uma frase primeiro.");
        return;
    }

    stopReading();

    reading = true;
    currentIndex = 0;

    readNextWord();
}

function readNextWord() {
    if (
        !reading ||
        currentIndex >= words.length
    ) {
        reading = false;
        clearActive();
        statusText.textContent =
            "Pronto";
        return;
    }

    const word =
        words[currentIndex];

    const elements =
        document.querySelectorAll(".word");

    clearActive();

    if (elements[currentIndex]) {
        elements[currentIndex]
            .classList
            .add("active");
    }

    statusText.textContent =
        `🔊 ${word}`;

    const utterance =
        createUtterance(word);

    utterance.onend = () => {
        if (!reading) {
            return;
        }

        currentIndex++;

        readingTimer =
            setTimeout(
                readNextWord,
                300
            );
    };

    utterance.onerror = () => {
        reading = false;
        clearActive();

        statusText.textContent =
            "❌ Erro na leitura";
    };

    speechSynthesis.speak(utterance);
}

wordButton.addEventListener(
    "click",
    speakWords
);


// ============================================================
// CONTROLE DE PARADA
// ============================================================

function clearActive() {
    document
        .querySelectorAll(".word")
        .forEach(element => {
            element.classList.remove("active");
        });
}

function stopReading() {
    reading = false;

    if (readingTimer) {
        clearTimeout(readingTimer);
        readingTimer = null;
    }

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    clearActive();
}

function stopAllSpeech() {
    stopReading();

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    statusText.textContent =
        "Parado";
}

stopButton.addEventListener(
    "click",
    () => {
        stopAllSpeech();

        writingStatus.textContent =
            "Leitura interrompida.";
    }
);


// ============================================================
// LIMPAR E COPIAR
// ============================================================

clearButton.addEventListener(
    "click",
    () => {
        stopReading();

        inputText.value = "";
        outputText.textContent =
            DEFAULT_OUTPUT;

        wordContainer.innerHTML = `
            <span class="empty">
                Traduza uma frase para começar.
            </span>
        `;

        charCount.textContent =
            "0 caracteres";

        statusText.textContent =
            "Pronto";

        words = [];
        currentIndex = 0;
    }
);

copyButton.addEventListener(
    "click",
    async () => {
        if (!hasValidTranslation()) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                outputText.textContent.trim()
            );

            statusText.textContent =
                "✓ Copiado";

            setTimeout(() => {
                statusText.textContent =
                    "Pronto";
            }, 1500);

        } catch (error) {
            console.error(error);

            alert(
                "Não foi possível copiar."
            );
        }
    }
);


// ============================================================
// TREINO DE ESCRITA PELO TECLADO
// ============================================================

function getWritingVoice() {
    const selectedVoice =
        getSelectedVoice();

    const languagePrefix =
        getSpeechLanguage()
            .substring(0, 2)
            .toLowerCase();

    if (
        selectedVoice &&
        selectedVoice.lang
            .toLowerCase()
            .startsWith(languagePrefix)
    ) {
        return selectedVoice;
    }

    return voices.find(voice =>
        voice.lang
            .toLowerCase()
            .startsWith(languagePrefix)
    );
}

function cleanTypedWord(word) {
    return String(word || "")
        .replace(
            /^[^\p{L}\p{N}]+/gu,
            ""
        )
        .replace(
            /[^\p{L}\p{N}'’\-]+$/gu,
            ""
        )
        .trim();
}

function speakTypedWord(word) {
    const cleanWord =
        cleanTypedWord(word);

    if (!cleanWord) {
        return;
    }

    if (!("speechSynthesis" in window)) {
        writingStatus.textContent =
            "Seu navegador não suporta voz.";

        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            cleanWord
        );

    utterance.lang =
        getSpeechLanguage();

    utterance.rate =
        Number(speed.value);

    const voice =
        getWritingVoice();

    if (voice) {
        utterance.voice = voice;
    }

    writingStatus.textContent =
        `🔊 Lendo: ${cleanWord}`;

    utterance.onend = () => {
        writingStatus.textContent =
            `✓ Palavra lida: ${cleanWord}`;
    };

    utterance.onerror = () => {
        writingStatus.textContent =
            "❌ Erro ao ler a palavra.";
    };

    speechSynthesis.speak(utterance);
}

/*
 * IMPORTANTE:
 * Não usamos keydown para bloquear a digitação.
 * O evento input ocorre depois que o teclado
 * já inseriu a letra ou o espaço no campo.
 */

writingInput.addEventListener(
    "input",
    event => {
        const currentValue =
            event.target.value;

        if (!currentValue) {
            previousWritingValue = "";
            lastSpokenWritingValue = "";

            writingStatus.textContent =
                "Digite uma palavra e pressione espaço.";

            return;
        }

        const isAddingText =
            currentValue.length >=
            previousWritingValue.length;

        const finishedWithSpace =
            /[\s\n]$/.test(currentValue);

        const isNewWord =
            currentValue !==
            lastSpokenWritingValue;

        if (
            autoRead.checked &&
            isAddingText &&
            finishedWithSpace &&
            isNewWord
        ) {
            const textWithoutSpace =
                currentValue.trimEnd();

            const typedWords =
                textWithoutSpace
                    .split(/\s+/)
                    .filter(Boolean);

            const lastWord =
                typedWords[
                    typedWords.length - 1
                ];

            if (lastWord) {
                lastSpokenWritingValue =
                    currentValue;

                speakTypedWord(lastWord);
            }
        } else if (!finishedWithSpace) {
            writingStatus.textContent =
                "Continue digitando...";
        }

        previousWritingValue =
            currentValue;
    }
);

writingInput.addEventListener(
    "focus",
    () => {
        writingStatus.textContent =
            "Campo ativo. Digite normalmente pelo teclado.";
    }
);

clearWritingButton.addEventListener(
    "click",
    () => {
        if ("speechSynthesis" in window) {
            speechSynthesis.cancel();
        }

        writingInput.value = "";
        previousWritingValue = "";
        lastSpokenWritingValue = "";

        writingStatus.textContent =
            "Digite uma palavra e pressione espaço.";

        writingInput.focus();
    }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

updateDirection();
loadVoices();