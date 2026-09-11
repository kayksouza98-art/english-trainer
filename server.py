import os
from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
DEEPL_URL = "https://api-free.deepl.com/v2/translate"
MAX_TEXT_LENGTH = 500

app = Flask(__name__)


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
                    f"O texto deve possuir no máximo "
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
                    "A variável DEEPL_API_KEY não está "
                    "configurada no Render."
                )
            }
        ), 500

    languages = language_pairs[direction]

    request_data = {
        "text": [text],
        "source_lang": languages["source_lang"],
        "target_lang": languages["target_lang"]
    }

    try:
        response = requests.post(
            DEEPL_URL,
            headers={
                "Authorization": (
                    f"DeepL-Auth-Key {api_key}"
                ),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "EnglishTrainer/2.0"
            },
            json=request_data,
            timeout=30
        )

    except requests.Timeout:
        return jsonify(
            {
                "error": (
                    "A DeepL demorou para responder. "
                    "Tente novamente."
                )
            }
        ), 504

    except requests.RequestException as error:
        app.logger.exception(
            "Erro de conexão com a DeepL."
        )

        return jsonify(
            {
                "error": (
                    "Não foi possível conectar à DeepL: "
                    f"{error}"
                )
            }
        ), 502

    if not response.ok:
        try:
            error_data = response.json()

            deepl_message = str(
                error_data.get(
                    "message",
                    response.text
                )
            )
        except ValueError:
            deepl_message = response.text

        if response.status_code == 400:
            message = (
                "A DeepL recusou os dados enviados: "
                f"{deepl_message}"
            )

        elif response.status_code == 403:
            message = (
                "A chave da DeepL é inválida ou não possui "
                "permissão para usar essa API."
            )

        elif response.status_code == 404:
            message = (
                "O endereço da API DeepL não foi encontrado."
            )

        elif response.status_code == 429:
            message = (
                "A DeepL limitou temporariamente as "
                "requisições. Aguarde e tente novamente."
            )

        elif response.status_code == 456:
            message = (
                "A cota de caracteres da DeepL foi atingida."
            )

        else:
            message = (
                f"Erro da DeepL ({response.status_code}): "
                f"{deepl_message}"
            )

        app.logger.error(
            "Erro DeepL %s: %s",
            response.status_code,
            deepl_message
        )

        return jsonify(
            {
                "error": message
            }
        ), response.status_code

    try:
        result = response.json()

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
                    "A DeepL não retornou nenhuma tradução."
                )
            }
        ), 502

    translation = str(
        translations[0].get("text", "")
    ).strip()

    if not translation:
        return jsonify(
            {
                "error": (
                    "A tradução retornada pela DeepL "
                    "está vazia."
                )
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
