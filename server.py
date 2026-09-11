import os
from html import unescape
from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
TRANSLATION_URL = "https://api.mymemory.translated.net/get"
MAX_TEXT_LENGTH = 500

app = Flask(__name__)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/style.css")
def style():
    return send_from_directory(BASE_DIR, "style.css")


@app.get("/script.js")
def script():
    return send_from_directory(BASE_DIR, "script.js")


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "application": "English Trainer V2",
        }
    )


@app.post("/translate")
def translate():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify(
            {
                "error": "Requisição JSON inválida."
            }
        ), 400

    text = str(data.get("text", "")).strip()
    direction = str(data.get("direction", "pt-en")).strip()

    if not text:
        return jsonify(
            {
                "error": "Digite um texto para traduzir."
            }
        ), 400

    if len(text) > MAX_TEXT_LENGTH:
        return jsonify(
            {
                "error": (
                    f"O texto deve possuir no máximo "
                    f"{MAX_TEXT_LENGTH} caracteres."
                )
            }
        ), 400

    language_pairs = {
        "pt-en": ("pt", "en"),
        "en-pt": ("en", "pt"),
    }

    if direction not in language_pairs:
        return jsonify(
            {
                "error": "Direção de tradução inválida."
            }
        ), 400

    source, target = language_pairs[direction]

    mymemory_email = os.environ.get(
        "MYMEMORY_EMAIL",
        "",
    ).strip()

    request_params = {
        "q": text,
        "langpair": f"{source}|{target}",
    }

    if mymemory_email:
        request_params["de"] = mymemory_email

    try:
        response = requests.get(
            TRANSLATION_URL,
            params=request_params,
            headers={
                "User-Agent": (
                    "EnglishTrainer/2.0 "
                    "(personal educational project)"
                ),
                "Accept": "application/json",
            },
            timeout=30,
        )

        if response.status_code == 429:
            return jsonify(
                {
                    "error": (
                        "O serviço de tradução atingiu o limite "
                        "temporário de requisições. Aguarde alguns "
                        "minutos e tente novamente."
                    )
                }
            ), 429

        response.raise_for_status()
        result = response.json()

    except requests.Timeout:
        return jsonify(
            {
                "error": (
                    "O serviço de tradução demorou "
                    "para responder."
                )
            }
        ), 504

    except requests.RequestException as error:
        app.logger.exception(
            "Erro ao consultar o serviço de tradução."
        )

        return jsonify(
            {
                "error": (
                    "Erro de conexão com o tradutor: "
                    f"{error}"
                )
            }
        ), 502

    except ValueError:
        return jsonify(
            {
                "error": (
                    "O tradutor retornou uma resposta inválida."
                )
            }
        ), 502

    response_data = result.get("responseData") or {}
    translation = response_data.get("translatedText")

    if not translation:
        details = result.get(
            "responseDetails",
            "A tradução não foi encontrada.",
        )

        return jsonify(
            {
                "error": str(details)
            }
        ), 502

    translation = unescape(str(translation)).strip()

    return jsonify(
        {
            "translation": translation
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
