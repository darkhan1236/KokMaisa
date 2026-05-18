import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_DOC_NAMES = (
    "KokMaisa_Project_Knowledge_Base_RAG.md",
    "KokMaisa_Project_Knowledge_Base_RAG.pdf",
    "backend/app/services/rag/knowledge/kazakhstan_pastures_agriculture_2026.md",
)


@dataclass(frozen=True)
class LoadedDocument:
    source: str
    path: str
    text: str
    modified_at: float


def project_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _configured_doc_paths() -> list[Path]:
    raw = os.getenv("KOKMAISA_RAG_DOCS", "").strip()
    if not raw:
        return [project_root() / name for name in DEFAULT_DOC_NAMES]

    paths: list[Path] = []
    for item in raw.split(os.pathsep):
        item = item.strip()
        if not item:
            continue
        path = Path(item)
        paths.append(path if path.is_absolute() else project_root() / path)
    return paths


def _read_text(path: Path) -> str:
    for encoding in ("utf-8-sig", "utf-8", "cp1251"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(encoding="utf-8", errors="replace")


def _read_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader
        except ImportError:
            return ""

    reader = PdfReader(str(path))
    pages: list[str] = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n\n".join(pages)


def _read_document(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        return _read_pdf(path)
    return _read_text(path)


def load_documents() -> list[LoadedDocument]:
    documents: list[LoadedDocument] = []
    for path in _configured_doc_paths():
        if not path.exists() or not path.is_file():
            continue
        text = _read_document(path).strip()
        if not text:
            continue
        stat = path.stat()
        documents.append(
            LoadedDocument(
                source=path.name,
                path=str(path),
                text=text,
                modified_at=stat.st_mtime,
            )
        )
    return documents
