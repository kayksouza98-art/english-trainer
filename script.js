const textInput = document.getElementById("textInput");
const direction = document.getElementById("direction");
const translateButton = document.getElementById(
    "translateButton"
);
const clearTranslationButton = document.getElementById(
    "clearTranslationButton"
);
const translationResult = document.getElementById(
    "translationResult"
);
const translationStatus = document.getElementById(
    "translationStatus"
);

const levelSelect = document.getElementById(
    "levelSelect"
);
const topicSelect = document.getElementById(
    "topicSelect"
);
const generateButton = document.getElementById(
    "generateButton"
);
const generatedText = document.getElementById(
    "generatedText"
);
const speakButton = document.getElementById(
    "speakButton"
);
const pauseButton = document.getElementById(
    "pauseButton"
);
const stopButton = document.getElementById(
    "stopButton"
);
const typingInput = document.getElementById(
    "typingInput"
);
const checkButton = document.getElementById(
    "checkButton"
);
const clearPracticeButton = document.getElementById(
    "clearPracticeButton"
);
const practiceStatus = document.getElementById(
    "practiceStatus"
);
const checkResult = document.getElementById(
    "checkResult"
);

let currentText = "";
let currentSpeech = null;

const texts = {
    beginner: {
        routine: [
            "I wake up early every morning. I brush my teeth and eat breakfast. Then I go to work.",
            "I get home at six o'clock. I have dinner with my family and watch television.",
            "My day is simple. I study English, drink coffee, and read a short book."
        ],
        travel: [
            "I am at the airport. I have my passport and my suitcase. I am ready for my trip.",
            "I want to visit the museum and take many pictures. The city is beautiful.",
            "We are staying at a small hotel near the beach. The weather is sunny."
        ],
        restaurant: [
            "I would like a hamburger and a glass of water, please.",
            "The restaurant is very nice. The food is hot and delicious.",
            "Can I have the menu, please? I would like to order dinner."
        ],
        work: [
            "I work in an office. I answer emails and talk to my colleagues.",
            "Today I have a meeting at ten o'clock. I need to prepare a report.",
            "My job is interesting. I learn something new every day."
        ],
        "free-time": [
            "In my free time, I like to listen to music and watch movies.",
            "I play soccer with my friends on Saturday afternoon.",
            "I enjoy reading books and walking in the park."
        ]
    },

    intermediate: {
        routine: [
            "Although my mornings are usually busy, I try to exercise before going to work.",
            "After finishing my responsibilities, I prepare dinner and spend time with my family.",
            "I have been studying English every day because I want to communicate more confidently."
        ],
        travel: [
            "Before leaving for the airport, I checked my passport and made sure I had packed everything.",
            "The city has several interesting places, so we decided to create a detailed travel plan.",
            "Our hotel was close to the beach, which made it easy to enjoy the beautiful weather."
        ],
        restaurant: [
            "The waiter recommended a local dish, and it turned out to be one of the best meals I had ever tried.",
            "We decided to make a reservation because the restaurant is usually crowded in the evening.",
            "The menu offered several vegetarian options, so everyone in our group found something they liked."
        ],
        work: [
            "During the meeting, my manager explained the goals for the next project.",
            "I usually organize my tasks in the morning so that I can work more efficiently.",
            "Working with an international team has helped me improve both my English and my professional skills."
        ],
        "free-time": [
            "When I have free time, I enjoy reading articles about technology and watching documentaries.",
            "I started learning photography because I wanted to record special moments during my trips.",
            "On weekends, I often meet my friends and look for new activities to enjoy together."
        ]
    },

    advanced: {
        routine: [
            "Despite having a demanding schedule, I make a conscious effort to maintain a healthy balance between work and personal life.",
            "Developing consistent habits has helped me become more productive without feeling overwhelmed by my daily responsibilities.",
            "I have realized that planning my day in advance allows me to focus on what truly deserves my attention."
        ],
        travel: [
            "Traveling to unfamiliar places has taught me to appreciate different perspectives and adapt to unexpected situations.",
            "Rather than following a strict itinerary, I prefer leaving enough room for spontaneous discoveries.",
            "The experience was particularly memorable because we had the opportunity to interact with local residents."
        ],
        restaurant: [
            "The chef managed to combine traditional ingredients with modern techniques, creating a remarkably balanced dish.",
            "Although the restaurant was relatively expensive, the quality of the service and food justified the cost.",
            "The waiter carefully explained the ingredients, which was helpful because one of our guests had dietary restrictions."
        ],
        work: [
            "Effective communication is essential when collaborating with people who have different professional backgrounds.",
            "The project required considerable attention to detail, particularly during the final stage of development.",
            "By reviewing our previous results, we were able to identify weaknesses and improve our overall strategy."
        ],
        "free-time": [
            "I find creative activities especially rewarding because they allow me to express ideas that are difficult to explain with words.",
            "Reading challenging books has expanded my vocabulary and encouraged me to think more critically.",
            "Instead of spending the entire weekend online, I try to participate in activities that contribute to my personal growth."
        ]
    }
};

function setStatus(element, message, type = "") {
    element.textContent = message;
    element.className = "status";

    if (type) {
        element.classList.add(type);
    }
}

function normalizeWords(text) {
    return text
        .toLowerCase()
        .replace(/[.,!?;:'"()]/g, "")
        .split(/\s+/)
        .filter(Boolean);
}

function chooseRandom(items) {
    const index = Math.floor(
        Math.random() * items.length
    );

    return items[index];
}

function showTab(tabName) {
    const tabs = document.querySelectorAll(".aba");
    const panels = document.querySelectorAll(".painel");

    tabs.forEach((tab) => {
        const isActive = tab.dataset.aba === tabName;
        tab.classList.toggle("ativa", isActive);
    });

    panels.forEach((panel) => {
        panel.classList.toggle(
            "ativo",
            panel.id === tabName
        );
    });
}

document.querySelectorAll(".aba").forEach((tab) => {
    tab.addEventListener("click", () => {
        showTab(tab.dataset.aba);
    });
});

translateButton.addEventListener("click", async () => {
    const text = textInput.value.trim();

    if (!text) {
        setStatus(
            translationStatus,
            "Digite um texto antes de traduzir.",
            "erro"
        );

        return;
    }

    translateButton.disabled = true;

    setStatus(
        translationStatus,
        "Traduzindo..."
    );

    translationResult.textContent = "";

    try {
        const response = await fetch("/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                direction: direction.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Erro ao traduzir."
            );
        }

        translationResult.textContent =
            data.translation;

        setStatus(
            translationStatus,
            "Tradução concluída.",
            "sucesso"
        );
    } catch (error) {
        setStatus(
            translationStatus,
            error.message,
            "erro"
        );

        translationResult.textContent =
            "Não foi possível realizar a tradução.";
    } finally {
        translateButton.disabled = false;
    }
});

clearTranslationButton.addEventListener(
    "click",
    () => {
        textInput.value = "";
        translationResult.textContent =
            "A tradução aparecerá aqui.";

        setStatus(
            translationStatus,
            ""
        );
    }
);

generateButton.addEventListener("click", () => {
    const level = levelSelect.value;
    const topic = topicSelect.value;
    const options = texts[level][topic];

    currentText = chooseRandom(options);
    generatedText.textContent = currentText;
    typingInput.value = "";
    checkResult.innerHTML = "";

    setStatus(
        practiceStatus,
        "Texto gerado. Clique em Ouvir e comece a digitar.",
        "sucesso"
    );

    stopSpeech();
});

function getSpeechRate() {
    const rates = {
        beginner: 0.72,
        intermediate: 0.88,
        advanced: 1.0
    };

    return rates[levelSelect.value];
}

function startSpeech() {
    if (!currentText) {
        setStatus(
            practiceStatus,
            "Gere um texto antes de ouvir.",
            "erro"
        );

        return;
    }

    if (!("speechSynthesis" in window)) {
        setStatus(
            practiceStatus,
            "Seu navegador não oferece leitura de voz.",
            "erro"
        );

        return;
    }

    stopSpeech();

    currentSpeech = new SpeechSynthesisUtterance(
        currentText
    );

    currentSpeech.lang = "en-US";
    currentSpeech.rate = getSpeechRate();
    currentSpeech.pitch = 1;

    currentSpeech.onstart = () => {
        setStatus(
            practiceStatus,
            "Leitura iniciada. Digite enquanto escuta.",
            "sucesso"
        );
    };

    currentSpeech.onend = () => {
        setStatus(
            practiceStatus,
            "Leitura concluída. Agora verifique sua resposta.",
            "sucesso"
        );

        currentSpeech = null;
    };

    currentSpeech.onerror = () => {
        setStatus(
            practiceStatus,
            "Não foi possível iniciar a leitura.",
            "erro"
        );

        currentSpeech = null;
    };

    window.speechSynthesis.speak(currentSpeech);
}

function pauseSpeech() {
    if (!("speechSynthesis" in window)) {
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();

        setStatus(
            practiceStatus,
            "Leitura pausada."
        );
    }
}

function stopSpeech() {
    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();
    currentSpeech = null;
}

speakButton.addEventListener(
    "click",
    startSpeech
);

pauseButton.addEventListener(
    "click",
    pauseSpeech
);

stopButton.addEventListener("click", () => {
    stopSpeech();

    setStatus(
        practiceStatus,
        "Leitura parada."
    );
});

checkButton.addEventListener("click", () => {
    if (!currentText) {
        setStatus(
            practiceStatus,
            "Gere um texto antes de verificar.",
            "erro"
        );

        return;
    }

    const expected = normalizeWords(currentText);
    const typed = normalizeWords(typingInput.value);

    if (typed.length === 0) {
        setStatus(
            practiceStatus,
            "Digite o texto que você ouviu.",
            "erro"
        );

        return;
    }

    let correct = 0;
    let resultHtml = "";

    expected.forEach((word, index) => {
        const typedWord = typed[index];

        if (typedWord === word) {
            correct += 1;

            resultHtml += `
                <span class="palavra-certa">
                    ${word}
                </span>
            `;
        } else {
            resultHtml += `
                <span class="palavra-faltando">
                    ${word}
                </span>
            `;
        }

        resultHtml += " ";
    });

    const percentage = Math.round(
        (correct / expected.length) * 100
    );

    checkResult.innerHTML = `
        <strong>Resultado: ${percentage}%</strong>
        <br>
        Você acertou ${correct} de
        ${expected.length} palavras.
        <br><br>
        <strong>Texto correto:</strong>
        <br>
        ${resultHtml}
    `;

    if (percentage >= 90) {
        setStatus(
            practiceStatus,
            "Excelente! Sua resposta está muito boa.",
            "sucesso"
        );
    } else if (percentage >= 60) {
        setStatus(
            practiceStatus,
            "Bom trabalho! Continue praticando.",
            "sucesso"
        );
    } else {
        setStatus(
            practiceStatus,
            "Tente ouvir novamente e repetir o exercício.",
            ""
        );
    }
});

clearPracticeButton.addEventListener("click", () => {
    typingInput.value = "";
    checkResult.innerHTML = "";

    setStatus(
        practiceStatus,
        ""
    );

    stopSpeech();
});
