# test_rag.py
from app.services.rag.assistant import build_rag_context

q = "Что такое RAG в KokMaisa и как он используется?"
ctx = build_rag_context(q)
print("HAS RESULTS:", ctx.has_results)
print("CONTEXT:\n", ctx.context[:4000])
print("SOURCES:", ctx.sources) 