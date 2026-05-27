import json
import re
from typing import Any

import httpx
from sqlalchemy.orm import Session

from core.config import settings


SUPPORTED_LANGS = ("ru", "kk", "en")
KK_GLOSSARY = {
    "көкмайса": {"ru": "Кокмайса", "kk": "Көкмайса", "en": "Kokmaisa"},
    "жайлау": {"ru": "Летнее пастбище", "kk": "Жайлау", "en": "Summer pasture"},
}


def normalize_lang(lang: str | None) -> str:
    raw = (lang or "").lower()
    if raw.startswith("kk"):
        return "kk"
    if raw.startswith("en"):
        return "en"
    return "ru"


def detect_lang(value: Any) -> str:
    text = " ".join(value) if isinstance(value, list) else str(value or "")
    if re.search(r"[әғқңөұүһіӘҒҚҢӨҰҮҺІ]", text):
        return "kk"
    if re.search(r"[А-Яа-яЁё]", text):
        return "ru"
    return "en"


def translatable_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(isinstance(item, str) and item.strip() for item in value)
    return False


def _copy_translations(values: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        field: {lang: value for lang in SUPPORTED_LANGS}
        for field, value in values.items()
        if translatable_value(value)
    }


def _looks_untranslated(value: Any, translations: dict[str, Any]) -> bool:
    if not isinstance(translations, dict):
        return True
    if any(not translatable_value(translations.get(lang)) for lang in SUPPORTED_LANGS):
        return True
    if isinstance(value, str):
        normalized = {str(translations.get(lang, "")).strip().lower() for lang in SUPPORTED_LANGS}
        return len(normalized) == 1 and value.strip().lower() in normalized
    return False


def _translate_text_google(text: str, source_lang: str, target_lang: str) -> str | None:
    if not text.strip() or source_lang == target_lang:
        return text
    glossary_match = KK_GLOSSARY.get(text.strip().lower()) if source_lang == "kk" else None
    if glossary_match:
        return glossary_match[target_lang]
    try:
        response = httpx.get(
            "https://translate.googleapis.com/translate_a/single",
            params={
                "client": "gtx",
                "sl": source_lang,
                "tl": target_lang,
                "dt": "t",
                "q": text,
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
        translated = "".join(part[0] for part in data[0] if part and part[0])
        return translated.strip() or None
    except Exception:
        return None


def _translate_value_google(value: Any, source_lang: str, target_lang: str) -> Any:
    if isinstance(value, list):
        return [
            _translate_text_google(item, source_lang, target_lang) or item
            if isinstance(item, str) else item
            for item in value
        ]
    if isinstance(value, str):
        return _translate_text_google(value, source_lang, target_lang) or value
    return value


def _google_translations(values: dict[str, Any], source_lang: str) -> dict[str, dict[str, Any]]:
    translated: dict[str, dict[str, Any]] = {}
    for field, value in values.items():
        translated[field] = {
            lang: _translate_value_google(value, source_lang, lang)
            for lang in SUPPORTED_LANGS
        }
    return translated


def _extract_json(text: str) -> dict[str, Any] | None:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return data if isinstance(data, dict) else None


def translate_values(values: dict[str, Any], source_lang: str | None = None) -> dict[str, dict[str, Any]]:
    payload = {k: v for k, v in values.items() if translatable_value(v)}
    if not payload:
        return {}

    source = normalize_lang(source_lang) if source_lang else detect_lang(next(iter(payload.values())))
    google_result = _google_translations(payload, source)
    if google_result and any(
        not _looks_untranslated(payload[field], values)
        for field, values in google_result.items()
    ):
        return google_result

    api_key = getattr(settings, "openai_api_key", "")
    model = getattr(settings, "openai_model", "meta-llama/llama-3.1-8b-instruct")
    base_url = getattr(settings, "openai_base_url", "https://openrouter.ai/api/v1").rstrip("/")
    if not api_key:
        return _copy_translations(payload)

    prompt = (
        "Translate KokMaisa database fields into Russian, Kazakh, and English. "
        "Return only valid JSON in this shape: "
        '{"field":{"ru":"...","kk":"...","en":"..."}}. '
        "Preserve arrays as arrays. Preserve names as natural names, not explanations. "
        f"Source language is {source}. Data: {json.dumps(payload, ensure_ascii=False)}"
    )

    try:
        with httpx.Client(timeout=8) as client:
            response = client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://kokmaisa.local",
                    "X-Title": "KokMaisa",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a precise translation engine. Return JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
    except Exception:
        return _copy_translations(payload)

    parsed = _extract_json(content)
    if not parsed:
        return _copy_translations(payload)

    result: dict[str, dict[str, Any]] = {}
    for field, original in payload.items():
        translated = parsed.get(field)
        if not isinstance(translated, dict):
            result[field] = {lang: original for lang in SUPPORTED_LANGS}
            continue
        result[field] = {}
        for lang in SUPPORTED_LANGS:
            value = translated.get(lang)
            if isinstance(original, list):
                result[field][lang] = value if isinstance(value, list) else original
            elif isinstance(value, list):
                result[field][lang] = ", ".join(str(item) for item in value if str(item).strip()) or original
            else:
                result[field][lang] = value if translatable_value(value) else original
    return result


def ensure_translations(
    db: Session,
    obj: Any,
    fields: tuple[str, ...],
    source_lang: str | None = None,
) -> dict[str, dict[str, Any]]:
    current = obj.translations if isinstance(getattr(obj, "translations", None), dict) else {}
    missing = {
        field: getattr(obj, field, None)
        for field in fields
        if translatable_value(getattr(obj, field, None))
        and (
            field not in current
            or not isinstance(current.get(field), dict)
            or _looks_untranslated(getattr(obj, field, None), current.get(field, {}))
        )
    }

    if not missing:
        return current

    updated = {**current, **translate_values(missing, source_lang)}
    obj.translations = updated
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return updated


def update_translations(
    obj: Any,
    changed_values: dict[str, Any],
    source_lang: str | None = None,
) -> None:
    translated = translate_values(changed_values, source_lang)
    if not translated:
        return
    current = obj.translations if isinstance(getattr(obj, "translations", None), dict) else {}
    obj.translations = {**current, **translated}


def localized_dict(obj: Any, fields: tuple[str, ...], lang: str | None) -> dict[str, Any]:
    selected = normalize_lang(lang)
    data = {
        column.name: getattr(obj, column.name)
        for column in obj.__table__.columns
    }
    translations = data.get("translations") if isinstance(data.get("translations"), dict) else {}
    for field in fields:
        value = translations.get(field, {}).get(selected) if isinstance(translations.get(field), dict) else None
        if translatable_value(value):
            data[field] = value
    return data
