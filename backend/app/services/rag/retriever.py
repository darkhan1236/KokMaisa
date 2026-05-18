import math
import re
from dataclasses import dataclass
from functools import lru_cache

from app.services.rag.chunker import DocumentChunk, chunk_documents
from app.services.rag.loader import load_documents


MIN_QUERY_TOKEN_LENGTH = 2
MIN_RELEVANCE_SCORE = 1.8

STOPWORDS = {
    "the", "and", "for", "with", "from", "this", "that", "what", "how", "why", "are", "you",
    "about", "into", "your", "please", "tell", "give",
    "как", "что", "для", "или", "это", "если", "при", "про", "мне", "его", "она", "они",
    "где", "кто", "чем", "надо", "нужно", "можно", "есть", "будет",
    "мен", "және", "үшін", "бұл", "қалай", "неге", "не", "бар", "жоқ", "туралы",
}

QUERY_EXPANSIONS = {
    "farm": ["ферма", "фермы", "хозяйство", "агрохозяйство", "қожалық"],
    "farms": ["ферма", "фермы", "хозяйство", "агрохозяйство", "қожалық"],
    "ферма": ["farm", "farms", "хозяйство", "агрохозяйство"],
    "фермы": ["farm", "farms", "хозяйство", "агрохозяйство"],
    "хозяйство": ["farm", "farms", "агрохозяйство"],
    "агрохозяйство": ["farm", "farms", "хозяйство", "enterprise"],
    "агрохозяйства": ["farm", "farms", "хозяйство", "enterprise"],
    "pasture": ["пастбище", "пастбища", "жайылым", "rangeland", "grazing"],
    "pastures": ["пастбище", "пастбища", "жайылым", "rangeland", "grazing"],
    "пастбище": ["pasture", "pastures", "жайылым", "rangeland", "grazing"],
    "пастбища": ["pasture", "pastures", "жайылым", "rangeland", "grazing"],
    "жайылым": ["pasture", "pastures", "пастбище", "пастбища"],
    "biomass": ["биомасса", "биомассы", "ц/га", "c/ha"],
    "биомасса": ["biomass", "ц/га", "c/ha"],
    "measurement": ["измерение", "измерения", "замер"],
    "measurements": ["измерение", "измерения", "замер"],
    "измерение": ["measurement", "measurements", "замер"],
    "измерения": ["measurement", "measurements", "замер"],
    "dashboard": ["дашборд", "аналитика", "графики"],
    "дашборд": ["dashboard", "аналитика", "графики"],
    "drone": ["дрон", "дроны"],
    "drones": ["дрон", "дроны"],
    "coverage": ["покров", "покрытие", "coverage"],
    "покрытие": ["coverage", "покров"],
    "quality": ["качество", "оценка", "score"],
    "photo": ["фото", "снимок", "изображение"],
    "map": ["карта", "границы", "контур"],
    "kazakhstan": ["казахстан", "қазақстан"],
    "казахстан": ["kazakhstan", "қазақстан"],
    "қазақстан": ["kazakhstan", "казахстан"],
    "degradation": ["деградация", "деградации", "эрозия", "overgrazing"],
    "деградация": ["degradation", "эрозия", "overgrazing"],
    "дефицит": ["shortage", "pasture", "пастбища"],
    "shortage": ["дефицит", "пастбища", "pasture"],
    "livestock": ["скот", "животноводство", "мал", "cattle", "sheep"],
    "животноводство": ["livestock", "скот", "мал"],
    "скот": ["livestock", "cattle", "sheep", "мал"],
    "fao": ["pasture", "rangeland", "sustainable"],
    "usda": ["agriculture", "livestock", "kazakhstan"],
}


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: DocumentChunk
    score: float


@dataclass(frozen=True)
class RagIndex:
    chunks: tuple[DocumentChunk, ...]
    token_sets: tuple[frozenset[str], ...]
    signatures: tuple[tuple[str, float], ...]


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9/]+", text.lower())
    return [
        token
        for token in tokens
        if len(token) >= MIN_QUERY_TOKEN_LENGTH and token not in STOPWORDS
    ]


def _expand_query_tokens(tokens: list[str]) -> list[str]:
    expanded = list(tokens)
    for token in tokens:
        expanded.extend(QUERY_EXPANSIONS.get(token, []))
    return expanded


def _build_index() -> RagIndex:
    documents = load_documents()
    chunks = tuple(chunk_documents(documents))
    token_sets = tuple(frozenset(tokenize(f"{chunk.title}\n{chunk.text}")) for chunk in chunks)
    signatures = tuple((document.path, document.modified_at) for document in documents)
    return RagIndex(chunks=chunks, token_sets=token_sets, signatures=signatures)


@lru_cache(maxsize=1)
def _cached_index(signatures: tuple[tuple[str, float], ...]) -> RagIndex:
    return _build_index()


def get_index() -> RagIndex:
    documents = load_documents()
    signatures = tuple((document.path, document.modified_at) for document in documents)
    return _cached_index(signatures)


def _score(query_tokens: list[str], chunk_tokens: frozenset[str], chunk: DocumentChunk) -> float:
    if not query_tokens or not chunk_tokens:
        return 0.0

    overlap = [token for token in query_tokens if token in chunk_tokens]
    if not overlap:
        return 0.0

    unique_overlap = set(overlap)
    title_tokens = set(tokenize(chunk.title))
    title_hits = len(unique_overlap & title_tokens)
    coverage = len(unique_overlap) / max(len(set(query_tokens)), 1)
    density = len(unique_overlap) / math.sqrt(max(len(chunk_tokens), 1))
    return (len(overlap) * 1.15) + (title_hits * 1.6) + (coverage * 2.0) + density


def retrieve(query: str, top_k: int = 4) -> list[RetrievedChunk]:
    index = get_index()
    if not index.chunks:
        return []

    query_tokens = _expand_query_tokens(tokenize(query))
    if not query_tokens:
        return []

    scored: list[RetrievedChunk] = []
    for chunk, token_set in zip(index.chunks, index.token_sets):
        score = _score(query_tokens, token_set, chunk)
        if score >= MIN_RELEVANCE_SCORE:
            scored.append(RetrievedChunk(chunk=chunk, score=round(score, 3)))

    scored.sort(key=lambda item: item.score, reverse=True)
    return scored[:top_k]
