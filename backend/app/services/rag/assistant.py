from dataclasses import dataclass

from app.services.rag.retriever import RetrievedChunk, retrieve


MAX_RAG_CONTEXT_CHARS = 5000
UNKNOWN_RAG_ANSWER_RU = "Пока не знаю точного ответа по этой теме в моей базе знаний."


@dataclass(frozen=True)
class RagContext:
    context: str
    has_results: bool
    sources: tuple[str, ...]


def _format_chunk(item: RetrievedChunk, number: int) -> str:
    chunk = item.chunk
    return (
        f"[{number}] Source: {chunk.source}; section: {chunk.title}; relevance: {item.score}\n"
        f"{chunk.text.strip()}"
    )


def build_rag_context(query: str, top_k: int = 4, page_context: str | None = None) -> RagContext:
    retrieval_query = query
    if page_context:
        retrieval_query = f"{query}\n\nPage context:\n{page_context}"

    results = retrieve(retrieval_query, top_k=top_k)
    if not results:
        return RagContext(
            context=(
                "No relevant KokMaisa knowledge-base snippets were found for the current user question.\n"
                f'If the question requires KokMaisa documentation knowledge, answer honestly: "{UNKNOWN_RAG_ANSWER_RU}"'
            ),
            has_results=False,
            sources=(),
        )

    parts = [
        "Relevant KokMaisa knowledge-base snippets retrieved for the current user question.",
        "Use these snippets as project documentation context. Do not claim they contain information that is not present.",
    ]
    parts.extend(_format_chunk(item, index) for index, item in enumerate(results, start=1))
    context = "\n\n".join(parts)

    if len(context) > MAX_RAG_CONTEXT_CHARS:
        context = context[:MAX_RAG_CONTEXT_CHARS] + "\n\n[RAG context was shortened.]"

    sources = tuple(dict.fromkeys(item.chunk.source for item in results))
    return RagContext(context=context, has_results=True, sources=sources)
