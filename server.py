import os
from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)

DEEPL_URL = "https://api-free.deepl.com/v2/translate"
MAX_TEXT_LENGTH = 500


@app.get("/")
def home():
    return send_from_directory(
        str(BASE_DIR),
        "index.html"
    )


@app.get("/style.css")
def style():
    return send_from_directory(
        str(BASE_DIR),
        "style.css"
    )


@app.get("/script.js")
def script():
    return send_from_directory(
        str(BASE_DIR),
        "script.js"
    )


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "application": "English Trainer V2"
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

    text = str(
        data.get("text", "")
    ).strip()

    direction = str(
        data.get("direction", "pt-en")
    ).strip()

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
                    "O texto deve possuir no máximo "
                    f"{MAX_TEXT_LENGTH} caracteres."
                )
            }
        ), 400

    language_pairs = {
        "pt-en": {
            "source_lang": "PT",
            "target_lang": "EN-US"
        },
        "en-pt": {
            "source_lang": "EN",
            "target_lang": "PT-BR"
        }
    }

    if direction not in language_pairs:
        return jsonify(
            {
                "error": "Direção de tradução inválida."
            }
        ), 400

    api_key = os.environ.get(
        "DEEPL_API_KEY",
        ""
    ).strip()

    if not api_key:
        return jsonify(
            {
                "error": (
                    "A variável DEEPL_API_KEY "
                    "não foi configurada no Render."
                )
            }
        ), 500

    languages = language_pairs[direction]

    request_data = {
        "text": text,
        "source_lang": languages["source_lang"],
        "target_lang": languages["target_lang"]
    }

    try:
        response = requests.post(
            DEEPL_URL,
            headers={
                "Authorization": f"DeepL-Auth-Key {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "EnglishTrainer/2.0"
            },
            json=request_data,
            timeout=30
        )

        if response.status_code == 403:
            return jsonify(
                {
                    "error": (
                        "A chave da DeepL é inválida "
                        "ou não tem permissão para usar a API."
                    )
                }
            ), 403

        if response.status_code == 456:
            return jsonify(
                {
                    "error": (
                        "A cota gratuita da DeepL "
                        "foi atingida."
                    )
                }
            ), 456

        if response.status_code == 429:
            return jsonify(
                {
                    "error": (
                        "A DeepL limitou temporariamente "
                        "as requisições. Tente novamente."
                    )
                }
            ), 429

        response.raise_for_status()

        result = response.json()

    except requests.Timeout:
        return jsonify(
            {
                "error": (
                    "A DeepL demorou para responder."
                )
            }
        ), 504

    except requests.RequestException as error:
        app.logger.exception(
            "Erro ao consultar a DeepL."
        )

        return jsonify(
            {
                "error": (
                    "Erro de conexão com a DeepL: "
                    f"{error}"
                )
            }
        ), 502

    except ValueError:
        return jsonify(
            {
                "error": (
                    "A DeepL retornou uma resposta inválida."
                )
            }
        ), 502

    translations = result.get(
        "translations",
        []
    )

    if not translations:
        return jsonify(
            {
                "error": (
                    "A DeepL não retornou uma tradução."
                )
            }
        ), 502

    translation = translations[0].get(
        "text",
        ""
    ).strip()

    if not translation:
        return jsonify(
            {
                "error": "A tradução retornada está vazia."
            }
        ), 502

    return jsonify(
        {
            "translation": translation
        }
    )


if __name__ == "__main__":
    port = int(
        os.environ.get("PORT", 5000)
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
