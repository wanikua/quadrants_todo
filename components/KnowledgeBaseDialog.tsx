"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Trash2, Upload, FileText, Sparkles, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface KnowledgeDoc {
  id: number
  title: string
  source_type: string
  filename: string | null
  status: "processing" | "ready" | "error"
  char_count: number
  chunk_count: number
  created_at: string
}

interface SourceChunk {
  documentId: number
  title: string
  chunkIndex: number
  content: string
  similarity: number
}

interface KnowledgeBaseDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KnowledgeBaseDialog({ projectId, open, onOpenChange }: KnowledgeBaseDialogProps) {
  const { t } = useTranslation()
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [adding, setAdding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [question, setQuestion] = useState("")
  const [searching, setSearching] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<SourceChunk[]>([])
  const [searched, setSearched] = useState(false)

  const loadDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const res = await fetch(`/api/knowledge/documents?projectId=${encodeURIComponent(projectId)}`)
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents || [])
      }
    } catch {
      // ignore — empty list is fine
    } finally {
      setLoadingDocs(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) loadDocs()
  }, [open, loadDocs])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setContent(String(reader.result || ""))
      if (!title.trim()) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ""))
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const addDocument = async () => {
    if (!content.trim()) {
      toast.error(t("kbEmptyContent"))
      return
    }
    setAdding(true)
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: title.trim(), content, sourceType: "text" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "failed")
      }
      toast.success(t("kbAddedToast"))
      setTitle("")
      setContent("")
      loadDocs()
    } catch (error) {
      toast.error(error instanceof Error && error.message !== "failed" ? error.message : t("kbAddError"))
    } finally {
      setAdding(false)
    }
  }

  const deleteDocument = async (id: number) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    } catch {
      toast.error(t("kbDeleteError"))
      loadDocs()
    }
  }

  const ask = async () => {
    if (!question.trim()) return
    setSearching(true)
    setAnswer(null)
    setSources([])
    setSearched(true)
    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, query: question.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "failed")
      }
      const data = await res.json()
      setAnswer(data.answer || null)
      setSources(data.sources || [])
    } catch (error) {
      toast.error(error instanceof Error && error.message !== "failed" ? error.message : t("kbSearchError"))
    } finally {
      setSearching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            {t("kbTitle")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t("kbSubtitle")}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ask your project */}
          <div className="rounded-2xl border-3 border-black bg-purple-50 p-4 shadow-bold-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-purple-900">
              <Sparkles className="h-4 w-4" /> {t("kbAsk")}
            </div>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !searching && ask()}
                placeholder={t("kbAskPlaceholder")}
                className="flex-1"
              />
              <Button onClick={ask} disabled={searching || !question.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("kbSearch")}
              </Button>
            </div>

            {searched && !searching && (
              <div className="mt-3 space-y-3">
                {answer ? (
                  <p className="whitespace-pre-wrap rounded-xl border-2 border-black bg-white p-3 text-sm">{answer}</p>
                ) : sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("kbNoAnswer")}</p>
                ) : null}

                {sources.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-bold text-gray-500">{t("kbSources")}</div>
                    <div className="space-y-1.5">
                      {sources.map((s, i) => (
                        <div key={`${s.documentId}-${s.chunkIndex}`} className="rounded-lg border border-black/10 bg-white p-2 text-xs">
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <span className="font-bold">
                              [{i + 1}] {s.title}
                            </span>
                            <span className="text-gray-400">{Math.round(s.similarity * 100)}%</span>
                          </div>
                          <p className="line-clamp-3 text-gray-600">{s.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add document */}
          <div className="space-y-2">
            <div className="text-sm font-bold">{t("kbAddDoc")}</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("kbDocTitlePlaceholder")} />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("kbDocContentPlaceholder")}
              className="min-h-[120px] font-mono text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="hidden"
                onChange={handleFile}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> {t("kbUpload")}
              </Button>
              <Button onClick={addDocument} disabled={adding || !content.trim()} className="ml-auto gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {adding ? t("kbAdding") : t("kbAdd")}
              </Button>
            </div>
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {loadingDocs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center">
                <FileText className="h-6 w-6 text-gray-300" />
                <span className="text-sm font-medium text-gray-400">{t("kbEmpty")}</span>
                <span className="text-xs text-gray-300">{t("kbEmptyHint")}</span>
              </div>
            ) : (
              docs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-3 rounded-xl border-2 border-black/10 bg-white px-3 py-2 hover:border-black/20"
                >
                  <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{doc.title}</div>
                    <div className="text-xs text-gray-400">
                      {doc.status === "ready"
                        ? `${doc.chunk_count} ${t("kbChunksSuffix")}`
                        : doc.status === "processing"
                          ? t("kbStatusProcessing")
                          : t("kbStatusError")}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
