import re
from dataclasses import dataclass

from app.services.rag.loader import LoadedDocument


MAX_CHUNK_CHARS = 1400
CHUNK_OVERLAP_CHARS = 180


@dataclass(frozen=True)
class DocumentChunk:
    source: str
    title: str
    text: str
    index: int


def _clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_sections(text: str) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    current_title = "KokMaisa knowledge base"
    current_lines: list[str] = []

    for line in _clean_text(text).split("\n"):
        heading = re.match(r"^(#{1,3})\s+(.+?)\s*$", line)
        if heading and current_lines:
            sections.append((current_title, "\n".join(current_lines).strip()))
            current_title = heading.group(2).strip()
            current_lines = [line]
            continue
        if heading:
            current_title = heading.group(2).strip()
        current_lines.append(line)

    if current_lines:
        sections.append((current_title, "\n".join(current_lines).strip()))

    return [(title, body) for title, body in sections if body]


def _window_text(text: str, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            paragraph_break = text.rfind("\n\n", start, end)
            sentence_break = max(text.rfind(". ", start, end), text.rfind("! ", start, end), text.rfind("? ", start, end))
            split_at = paragraph_break if paragraph_break > start + max_chars // 2 else sentence_break
            if split_at > start + max_chars // 2:
                end = split_at + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break
        start = max(end - CHUNK_OVERLAP_CHARS, start + 1)

    return chunks


def chunk_documents(documents: list[LoadedDocument]) -> list[DocumentChunk]:
    chunks: list[DocumentChunk] = []
    for document in documents:
        for title, section_text in _split_sections(document.text):
            for text_window in _window_text(section_text):
                chunks.append(
                    DocumentChunk(
                        source=document.source,
                        title=title,
                        text=text_window,
                        index=len(chunks) + 1,
                    )
                )
    return chunks
