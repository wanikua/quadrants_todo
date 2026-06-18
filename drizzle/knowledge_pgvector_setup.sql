-- Project Knowledge Base — pgvector setup
-- Run this ONCE against your Neon database BEFORE `pnpm db:push`.
-- Neon ships pgvector; this just enables the extension so the vector(1024)
-- column and the HNSW index in app/db/schema.ts can be created.

CREATE EXTENSION IF NOT EXISTS vector;

-- After this, run:  pnpm db:push
-- (drizzle-kit will create knowledge_documents, knowledge_chunks, and the
--  hnsw vector_cosine_ops index from the Drizzle schema.)
--
-- If `db:push` cannot create the HNSW index on your Postgres version, create it
-- manually instead:
--   CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
--     ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
